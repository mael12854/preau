-- Bilan d'un rendez-vous parents-profs : le professeur rédige un bilan et met une note sur 20
-- dans chaque matière qu'il enseigne à l'élève. Chaque note devient une évaluation publiée « Bilan RPP »
-- (visible par l'élève et sa famille, comptée dans les moyennes).

create table public.meeting_reports (
  booking_id uuid primary key references public.meeting_bookings (id),
  summary text not null check (char_length(summary) between 1 and 4000),
  written_by uuid not null references public.profiles (id),
  written_at timestamptz not null default now()
);

create table public.meeting_report_scores (
  booking_id uuid not null references public.meeting_reports (booking_id),
  subject_id text not null references public.subjects (id),
  assessment_id uuid not null references public.assessments (id),
  score numeric(4, 2) not null check (score between 0 and 20 and score * 2 = round(score * 2)),
  primary key (booking_id, subject_id)
);

alter table public.meeting_reports enable row level security;
alter table public.meeting_report_scores enable row level security;

-- Lisible par le professeur du rendez-vous, l'élève et sa famille, l'administration de l'école.
create or replace function private.can_read_meeting_report(p_booking uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.meeting_bookings b join public.parent_meetings m on m.id = b.meeting_id
    where b.id = p_booking
      and (b.teacher_id = private.me() or private.is_family_of(b.student_id)
           or (private.is_admin_staff() and m.school_id = private.my_school())))
$$;
create policy "bilan RPP : professeur, famille, administration" on public.meeting_reports for select to authenticated
  using ((select private.can_read_meeting_report(booking_id)));
create policy "notes du bilan RPP : comme le bilan" on public.meeting_report_scores for select to authenticated
  using ((select private.can_read_meeting_report(booking_id)));
revoke all on public.meeting_reports, public.meeting_report_scores from anon;
revoke insert, update on public.meeting_reports, public.meeting_report_scores from authenticated;

-- Matières que ce professeur enseigne à cet élève (une classe par matière).
create or replace function private.report_subject_classes(p_teacher uuid, p_student uuid)
returns table (subject_id text, class_id uuid) language sql stable security definer set search_path = '' as $$
  select x.subject_id, (array_agg(x.class_id order by x.class_id))[1]
  from (
    select t.subject_id, t.class_id from public.teachings t where t.teacher_id = p_teacher
    union
    select l.subject_id, l.class_id from public.lessons l where l.teacher_id = p_teacher and l.subject_id is not null
  ) x
  where private.in_class(p_student, x.class_id)
  group by x.subject_id
$$;

create or replace function private.report_subjects(p_teacher uuid, p_student uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', r.subject_id, 'name', s.name) order by s.name), '[]')
  from private.report_subject_classes(p_teacher, p_student) r join public.subjects s on s.id = r.subject_id
$$;

create or replace function private.meeting_report_json(p_booking uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'summary', r.summary, 'written_at', r.written_at,
    'scores', (select coalesce(jsonb_agg(jsonb_build_object('subject_id', x.subject_id, 'name', s.name, 'score', x.score) order by s.name), '[]')
               from public.meeting_report_scores x join public.subjects s on s.id = x.subject_id where x.booking_id = r.booking_id))
  from public.meeting_reports r where r.booking_id = p_booking
$$;

-- Rédiger (ou corriger) le bilan : le professeur du rendez-vous, une fois le rendez-vous commencé.
-- p_scores : {"maths": 14.5, "pc": 12} — une note pour chaque matière qu'il enseigne à l'élève.
create or replace function public.save_meeting_report(p_booking uuid, p_summary text, p_scores jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b public.meeting_bookings; s public.meeting_slots; m public.parent_meetings;
  v_grading text; v_term smallint; v_new boolean; r record; v_score numeric; v_txt text; v_a uuid; v_level public.eval_value; v_msg uuid;
begin
  select * into b from public.meeting_bookings where id = p_booking and cancelled_at is null;
  if b.id is null or b.teacher_id is distinct from private.me() then
    raise exception 'Rendez-vous introuvable' using errcode = '42501';
  end if;
  select * into s from public.meeting_slots where id = b.slot_id;
  select * into m from public.parent_meetings where id = b.meeting_id;
  if s.starts_at > now() then raise exception 'Vous pourrez rédiger le bilan une fois le rendez-vous commencé.'; end if;
  if coalesce(trim(p_summary), '') = '' then raise exception 'Rédigez le bilan du rendez-vous.'; end if;
  if p_scores is not null and jsonb_typeof(p_scores) <> 'object' then raise exception 'Notes invalides.'; end if;
  if exists (select 1 from jsonb_object_keys(coalesce(p_scores, '{}')) k
             where k not in (select subject_id from private.report_subject_classes(b.teacher_id, b.student_id))) then
    raise exception 'Vous ne notez que les matières que vous enseignez à cet élève.';
  end if;
  select sc.grading::text into v_grading from public.schools sc where sc.id = m.school_id;
  v_term := case when extract(month from m.day) between 9 and 12 then 1 when extract(month from m.day) between 1 and 3 then 2 else 3 end;

  v_new := not exists (select 1 from public.meeting_reports where booking_id = b.id);
  insert into public.meeting_reports (booking_id, summary, written_by) values (b.id, left(trim(p_summary), 4000), private.me())
  on conflict (booking_id) do update set summary = excluded.summary, written_by = excluded.written_by, written_at = now();

  for r in select rc.subject_id, rc.class_id, su.name from private.report_subject_classes(b.teacher_id, b.student_id) rc
           join public.subjects su on su.id = rc.subject_id loop
    v_txt := nullif(trim(coalesce(p_scores ->> r.subject_id, '')), '');
    if v_txt is null then raise exception 'Mettez une note sur 20 en %.', r.name; end if;
    begin v_score := replace(v_txt, ',', '.')::numeric;
    exception when others then raise exception 'Note invalide en %.', r.name; end;
    if v_score < 0 or v_score > 20 or v_score * 2 <> round(v_score * 2) then
      raise exception 'Note entre 0 et 20, au demi-point, en %.', r.name;
    end if;
    v_level := case when v_score >= 15 then 'TB' when v_score >= 10 then 'MS' when v_score >= 5 then 'MF' else 'MI' end;
    select x.assessment_id into v_a from public.meeting_report_scores x where x.booking_id = b.id and x.subject_id = r.subject_id;
    if v_a is null then
      insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills, published_at)
      values (r.class_id, r.subject_id, b.teacher_id, 'Bilan RPP', m.day, v_term,
              case when v_grading = 'note20' then '{}'::text[] else array['Bilan RPP'] end, now())
      returning id into v_a;
      insert into public.meeting_report_scores (booking_id, subject_id, assessment_id, score) values (b.id, r.subject_id, v_a, v_score);
    else
      update public.meeting_report_scores set score = v_score where booking_id = b.id and subject_id = r.subject_id;
    end if;
    insert into public.assessment_results (assessment_id, student_id, level, skill_levels, score)
    values (v_a, b.student_id,
            case when v_grading = 'note20' then 'NE'::public.eval_value else v_level end,
            case when v_grading = 'note20' then '{}'::public.eval_value[] else array[v_level] end, v_score)
    on conflict (assessment_id, student_id) do update
      set score = excluded.score, level = excluded.level, skill_levels = excluded.skill_levels, updated_at = now();
  end loop;

  -- La famille (et l'élève qui a réservé) est prévenue au premier bilan.
  if v_new then
    insert into public.messages (school_id, sender_id, subject, body)
    values (m.school_id, b.teacher_id, 'Bilan du rendez-vous · ' || (select display_name from public.profiles where id = b.teacher_id),
      'Bonjour,' || E'\n\n' || 'Le bilan de votre rendez-vous du ' || to_char(s.starts_at at time zone 'Europe/Paris', 'DD/MM à HH24"h"MI')
      || ' pour ' || (select display_name from public.profiles where id = b.student_id) || ' est disponible dans Préau : Réunions parents-profs.')
    returning id into v_msg;
    insert into public.message_recipients (message_id, recipient_id)
    select v_msg, g.guardian_id from public.guardians g where g.student_id = b.student_id and g.guardian_id <> b.teacher_id
    union select v_msg, b.parent_id where b.parent_id <> b.teacher_id
    union select v_msg, b.student_id where b.student_id <> b.teacher_id
    on conflict do nothing;
  end if;
end $$;

-- Bilans à rédiger par la personne connectée (rendez-vous commencés, sans bilan).
create or replace function public.pending_meeting_reports() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.meeting_bookings b join public.meeting_slots s on s.id = b.slot_id
  where b.teacher_id = private.me() and b.cancelled_at is null and s.starts_at <= now()
    and not exists (select 1 from public.meeting_reports r where r.booking_id = b.id)
$$;

create or replace function public.meeting_board(p_meeting uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m public.parent_meetings;
begin
  select * into m from public.parent_meetings where id = p_meeting;
  if m.id is null or not (private.meeting_staff(p_meeting) or private.meeting_family(p_meeting)) then
    raise exception 'Réunion introuvable' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'meeting', jsonb_build_object('id', m.id, 'title', m.title, 'day', m.day, 'starts', to_char(m.starts, 'HH24:MI'),
      'ends', to_char(m.ends, 'HH24:MI'), 'slot_minutes', m.slot_minutes, 'cancel_hours', m.cancel_hours, 'open', m.open,
      'mine', m.created_by = private.me(),
      'classes', (select jsonb_agg(c.name order by c.name) from public.parent_meeting_classes mc join public.classes c on c.id = mc.class_id where mc.meeting_id = m.id)),
    -- Professeur : ses créneaux et qui vient.
    'my_slots', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
        'booking', (select jsonb_build_object('id', b.id, 'student', st.display_name, 'parent', pa.display_name,
                      'can_report', s.starts_at <= now(),
                      'subjects', private.report_subjects(b.teacher_id, b.student_id),
                      'report', private.meeting_report_json(b.id))
                    from public.meeting_bookings b join public.profiles st on st.id = b.student_id join public.profiles pa on pa.id = b.parent_id
                    where b.slot_id = s.id and b.cancelled_at is null))
        order by s.starts_at), '[]')
      from public.meeting_slots s where s.meeting_id = m.id and s.teacher_id = private.me() and not s.removed),
    -- Familles : pour chaque enfant concerné, ses professeurs et leurs créneaux.
    'children', (select coalesce(jsonb_agg(jsonb_build_object(
        'student_id', ch.id, 'name', sp.display_name,
        'teachers', (select coalesce(jsonb_agg(jsonb_build_object(
            'teacher_id', tp.id, 'name', tp.display_name,
            'slots', (select coalesce(jsonb_agg(jsonb_build_object(
                'id', s.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
                'state', case when exists (select 1 from public.meeting_bookings b where b.slot_id = s.id and b.cancelled_at is null and b.student_id = ch.id) then 'mine'
                              when exists (select 1 from public.meeting_bookings b where b.slot_id = s.id and b.cancelled_at is null) then 'taken'
                              else 'free' end) order by s.starts_at), '[]')
              from public.meeting_slots s where s.meeting_id = m.id and s.teacher_id = tp.id and not s.removed)
          ) order by tp.display_name), '[]')
          from public.profiles tp
          where tp.id in (select s.teacher_id from public.meeting_slots s where s.meeting_id = m.id and not s.removed)
            and private.teacher_has_student(tp.id, ch.id))
      ) order by sp.display_name), '[]')
      from private.my_children() ch(id) join public.profiles sp on sp.id = ch.id
      where exists (select 1 from public.parent_meeting_classes mc where mc.meeting_id = m.id and private.in_class(ch.id, mc.class_id))),
    -- Parcours de la famille (ses enfants), trié par heure.
    'my_bookings', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'place', s.place, 'visio_url', s.visio_url,
        'teacher', t.display_name, 'student', st.display_name,
        'can_cancel', now() <= s.starts_at - make_interval(hours => m.cancel_hours),
        'report', private.meeting_report_json(b.id)) order by s.starts_at), '[]')
      from public.meeting_bookings b join public.meeting_slots s on s.id = b.slot_id
      join public.profiles t on t.id = b.teacher_id join public.profiles st on st.id = b.student_id
      where b.meeting_id = m.id and b.cancelled_at is null and b.student_id in (select private.my_children()))
  );
end $$;

revoke all on function private.can_read_meeting_report(uuid), private.report_subject_classes(uuid, uuid),
  private.report_subjects(uuid, uuid), private.meeting_report_json(uuid) from public, anon;
grant execute on function private.can_read_meeting_report(uuid) to authenticated;
revoke all on function public.save_meeting_report(uuid, text, jsonb), public.pending_meeting_reports() from public, anon;
grant execute on function public.save_meeting_report(uuid, text, jsonb), public.pending_meeting_reports() to authenticated;
