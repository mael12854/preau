-- Bilan RPP : une seule évaluation par rendez-vous (matière « Bilan RPP »), une compétence par matière notée,
-- ne concernant que l'élève du rendez-vous (les autres élèves de la classe n'y figurent pas, même côté professeur).

insert into public.subjects (id, name, hue, skills) values ('rpp', 'Bilan RPP', 255, '{}') on conflict (id) do nothing;

alter table public.assessments add column if not exists student_id uuid references public.students (profile_id);
alter table public.meeting_reports add column if not exists assessment_id uuid references public.assessments (id);

-- Évaluation individuelle : visible du professeur, de l'élève et sa famille, de la vie scolaire et de la direction.
alter policy "évaluations visibles" on public.assessments
  using (teacher_id = (select private.me())
      or (published_at is not null and (select private.can_see_class(class_id))
          and ((select private.my_kind()) <> 'secretariat')
          and (student_id is null or (select private.is_family_of(student_id))
               or (select private.my_kind()) in ('cpe', 'direction'))));

create or replace function private.rpp_level(p_score numeric) returns public.eval_value
language sql immutable set search_path = '' as $$
  select (case when p_score >= 15 then 'TB' when p_score >= 10 then 'MS' when p_score >= 5 then 'MF' else 'MI' end)::public.eval_value
$$;

-- Écrit (ou réécrit) l'évaluation unique d'un bilan à partir des notes enregistrées.
create or replace function private.sync_rpp_assessment(p_booking uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b public.meeting_bookings; m public.parent_meetings; v_a uuid; v_skills text[]; v_levels public.eval_value[]; v_avg numeric;
        v_class uuid; v_term smallint; v_title text; v_grading text;
begin
  select * into b from public.meeting_bookings where id = p_booking;
  select * into m from public.parent_meetings where id = b.meeting_id;
  select array_agg(su.name order by su.name), array_agg(private.rpp_level(x.score) order by su.name), round(avg(x.score) * 2) / 2
    into v_skills, v_levels, v_avg
    from public.meeting_report_scores x join public.subjects su on su.id = x.subject_id where x.booking_id = p_booking;
  if v_skills is null then return null; end if;
  select s.class_id into v_class from public.students s where s.profile_id = b.student_id;
  select sc.grading::text into v_grading from public.schools sc where sc.id = m.school_id;
  v_term := case when extract(month from m.day) between 9 and 12 then 1 when extract(month from m.day) between 1 and 3 then 2 else 3 end;
  v_title := 'Bilan RPP · ' || (select display_name from public.profiles where id = b.student_id);
  select assessment_id into v_a from public.meeting_reports where booking_id = p_booking;
  if v_a is null then
    insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills, published_at, student_id)
    values (v_class, 'rpp', b.teacher_id, v_title, m.day, v_term, v_skills, now(), b.student_id)
    returning id into v_a;
    update public.meeting_reports set assessment_id = v_a where booking_id = p_booking;
  else
    update public.assessments set skills = v_skills, title = v_title, subject_id = 'rpp', student_id = b.student_id,
      class_id = coalesce(v_class, class_id), held_on = m.day, term = v_term, published_at = coalesce(published_at, now()) where id = v_a;
  end if;
  insert into public.assessment_results (assessment_id, student_id, level, skill_levels, score)
  values (v_a, b.student_id, case when v_grading = 'note20' then 'NE'::public.eval_value else private.rpp_level(v_avg) end, v_levels, v_avg)
  on conflict (assessment_id, student_id) do update
    set level = excluded.level, skill_levels = excluded.skill_levels, score = excluded.score, updated_at = now();
  update public.meeting_report_scores set assessment_id = v_a where booking_id = p_booking;
  return v_a;
end $$;
revoke all on function private.sync_rpp_assessment(uuid) from public, anon, authenticated;

create or replace function public.save_meeting_report(p_booking uuid, p_summary text, p_scores jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b public.meeting_bookings; s public.meeting_slots; m public.parent_meetings;
  v_new boolean; r record; v_score numeric; v_txt text; v_msg uuid; v_a uuid;
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

  v_new := not exists (select 1 from public.meeting_reports where booking_id = b.id);
  insert into public.meeting_reports (booking_id, summary, written_by) values (b.id, left(trim(p_summary), 4000), private.me())
  on conflict (booking_id) do update set summary = excluded.summary, written_by = excluded.written_by, written_at = now();
  select assessment_id into v_a from public.meeting_reports where booking_id = b.id;

  for r in select rc.subject_id, su.name from private.report_subject_classes(b.teacher_id, b.student_id) rc
           join public.subjects su on su.id = rc.subject_id loop
    v_txt := nullif(trim(coalesce(p_scores ->> r.subject_id, '')), '');
    if v_txt is null then raise exception 'Mettez une note sur 20 en %.', r.name; end if;
    begin v_score := replace(v_txt, ',', '.')::numeric;
    exception when others then raise exception 'Note invalide en %.', r.name; end;
    if v_score < 0 or v_score > 20 or v_score * 2 <> round(v_score * 2) then
      raise exception 'Note entre 0 et 20, au demi-point, en %.', r.name;
    end if;
    if v_a is null then
      -- Première écriture : l'évaluation unique est créée juste après ; on la crée ici vide pour la clé.
      insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills, student_id)
      select st.class_id, 'rpp', b.teacher_id, 'Bilan RPP', m.day, 1, '{}', b.student_id from public.students st where st.profile_id = b.student_id
      returning id into v_a;
      update public.meeting_reports set assessment_id = v_a where booking_id = b.id;
    end if;
    insert into public.meeting_report_scores (booking_id, subject_id, assessment_id, score) values (b.id, r.subject_id, v_a, v_score)
    on conflict (booking_id, subject_id) do update set score = excluded.score, assessment_id = excluded.assessment_id;
  end loop;
  perform private.sync_rpp_assessment(b.id);

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

-- Bilans déjà rédigés : une des évaluations par matière devient l'évaluation unique ; les autres sont dépubliées
-- (à effacer ensuite, voir le message de la session).
do $$
declare r record; v_keep uuid;
begin
  for r in select booking_id from public.meeting_reports where assessment_id is null loop
    select min(x.assessment_id::text)::uuid into v_keep from public.meeting_report_scores x where x.booking_id = r.booking_id;
    if v_keep is null then continue; end if;
    update public.assessments set published_at = null, title = 'Ancien bilan RPP (à effacer)'
     where id in (select assessment_id from public.meeting_report_scores where booking_id = r.booking_id) and id <> v_keep;
    update public.meeting_reports set assessment_id = v_keep where booking_id = r.booking_id;
    perform private.sync_rpp_assessment(r.booking_id);
  end loop;
end $$;
