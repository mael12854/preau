-- Absence ou retard noté à l'appel : message aux responsables (pour justifier), ou à l'élève lui-même
-- s'il n'a pas de responsable (élève majeur ou autonome). L'e-mail « Vous avez un message » suit (notifications).
create or replace function private.notify_absence(p_student uuid, p_lesson uuid, p_late boolean, p_sender uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v record; v_id uuid; v_self boolean; v_when text; v_what text;
  v_days text[] := array['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  v_months text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
begin
  select st.first_name, st.display_name, st.school_id, s.name as subject, c.name as class_name,
         l.starts_at at time zone 'Europe/Paris' as t0, l.ends_at at time zone 'Europe/Paris' as t1,
         coalesce(p_sender, l.teacher_id) as sender
    into v
    from public.lessons l join public.subjects s on s.id = l.subject_id join public.classes c on c.id = l.class_id
    join public.profiles st on st.id = p_student
   where l.id = p_lesson;
  if v.sender is null then return; end if;
  v_self := not exists (select 1 from public.guardians g where g.student_id = p_student);
  v_when := v_days[extract(isodow from v.t0)::int] || ' ' || extract(day from v.t0)::int || ' ' || v_months[extract(month from v.t0)::int]
            || ', de ' || to_char(v.t0, 'HH24"h"MI') || ' à ' || to_char(v.t1, 'HH24"h"MI');
  v_what := case when p_late then 'en retard' else 'absent' end;
  insert into public.messages (school_id, sender_id, subject, body)
  values (v.school_id, v.sender,
    case when p_late then 'Retard' else 'Absence' end || ' de ' || coalesce(v.first_name, v.display_name) || ' · ' || v.subject || ' ' || to_char(v.t0, 'HH24"h"MI'),
    case when v_self then
      'Bonjour,' || E'\n\n' || 'Vous avez été noté(e) ' || v_what || ' au cours de ' || v.subject || ' (' || v.class_name || ') du ' || v_when || '.'
      || E'\n\n' || 'Merci de justifier ' || case when p_late then 'ce retard' else 'cette absence' end
      || ' dans Préau : Vie scolaire, puis « Justifier ». S''il s''agit d''une erreur, répondez à ce message.'
    else
      'Bonjour,' || E'\n\n' || v.display_name || ' a été noté(e) ' || v_what || ' au cours de ' || v.subject || ' (' || v.class_name || ') du ' || v_when || '.'
      || E'\n\n' || 'Merci de justifier ' || case when p_late then 'ce retard' else 'cette absence' end
      || ' dans Préau : Vie scolaire, puis « Justifier ». Si votre enfant devait être présent, ou s''il s''agit d''une erreur, répondez à ce message.'
    end)
  returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select v_id, r from (
    select g.guardian_id as r from public.guardians g where g.student_id = p_student
    union select p_student where v_self) x
  where r <> v.sender;
end $$;
revoke all on function private.notify_absence(uuid, uuid, boolean, uuid) from public, anon, authenticated;

create or replace function private.attendance_to_life_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_l record;
begin
  if new.status in ('absent', 'late') then
    select l.starts_at, l.ends_at, s.name as subject into v_l
      from public.lessons l join public.subjects s on s.id = l.subject_id where l.id = new.lesson_id;
    insert into public.life_events (student_id, kind, occurred_at, whole_day, detail, status, created_by, lesson_id)
    values (new.student_id, case when new.status = 'absent' then 'absence' else 'retard' end::public.life_event_kind,
            v_l.starts_at, false,
            v_l.subject || ' · ' || to_char(v_l.starts_at at time zone 'Europe/Paris', 'HH24:MI') || '–' || to_char(v_l.ends_at at time zone 'Europe/Paris', 'HH24:MI'),
            'a_justifier', new.recorded_by, new.lesson_id)
    on conflict (lesson_id, student_id) where lesson_id is not null do update
      set kind = excluded.kind, detail = excluded.detail, voided = false,
          status = case when public.life_events.voided or public.life_events.kind <> excluded.kind
                        then 'a_justifier'::public.life_event_status else public.life_events.status end;
    -- Message seulement quand l'élève vient d'être noté absent ou en retard (pas à chaque réenregistrement de l'appel).
    if tg_op = 'INSERT' or old.status is distinct from new.status then
      perform private.notify_absence(new.student_id, new.lesson_id, new.status = 'late', new.recorded_by);
    end if;
  else
    update public.life_events set voided = true where lesson_id = new.lesson_id and student_id = new.student_id;
  end if;
  return new;
end $$;
