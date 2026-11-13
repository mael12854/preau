-- Les élèves réservent aussi leurs rendez-vous parents-profs (pour eux-mêmes).

-- « Enfants suivis » : les enfants d'un responsable, ou l'élève lui-même.
create or replace function private.my_children() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select g.student_id from public.guardians g where g.guardian_id = private.me()
  union
  select private.me() where private.my_kind() = 'eleve'
$$;

create or replace function public.book_meeting_slot(p_slot uuid, p_student uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.meeting_slots; m public.parent_meetings; v_id uuid;
begin
  if private.me() is null or not private.is_family_of(p_student) then
    raise exception 'Seuls l''élève et ses responsables peuvent réserver.' using errcode = '42501';
  end if;
  select * into s from public.meeting_slots where id = p_slot and not removed;
  select * into m from public.parent_meetings where id = s.meeting_id;
  if s.id is null or m.id is null then raise exception 'Créneau introuvable' using errcode = '42501'; end if;
  if not m.open then raise exception 'Les réservations sont fermées pour cette réunion.'; end if;
  if s.starts_at <= now() then raise exception 'Ce créneau est passé.'; end if;
  if not exists (select 1 from public.parent_meeting_classes mc where mc.meeting_id = m.id and private.in_class(p_student, mc.class_id)) then
    raise exception 'Cette réunion ne concerne pas cette classe.';
  end if;
  if not private.teacher_has_student(s.teacher_id, p_student) then
    raise exception 'Ce professeur n''enseigne pas à cet élève.';
  end if;
  begin
    insert into public.meeting_bookings (slot_id, meeting_id, teacher_id, student_id, parent_id, during)
    values (s.id, m.id, s.teacher_id, p_student, private.me(), tstzrange(s.starts_at, s.ends_at))
    returning id into v_id;
  exception
    when unique_violation then
      if exists (select 1 from public.meeting_bookings where slot_id = s.id and cancelled_at is null) then
        raise exception 'Ce créneau vient d''être réservé par une autre famille.';
      end if;
      raise exception 'Un rendez-vous avec ce professeur est déjà pris pour cet élève.';
    when exclusion_violation then
      raise exception 'Vous avez déjà un rendez-vous à cette heure-là.';
  end;
  perform private.notify_meeting(v_id, false);
  return v_id;
end $$;

create or replace function public.cancel_meeting_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare b public.meeting_bookings; m public.parent_meetings; v_family boolean;
begin
  select * into b from public.meeting_bookings where id = p_booking and cancelled_at is null;
  select * into m from public.parent_meetings where id = b.meeting_id;
  if b.id is null then raise exception 'Rendez-vous introuvable' using errcode = '42501'; end if;
  v_family := private.is_family_of(b.student_id);
  if not (v_family or b.teacher_id = private.me() or (private.is_admin_staff() and m.school_id = private.my_school())) then
    raise exception 'Rendez-vous introuvable' using errcode = '42501';
  end if;
  if v_family and b.teacher_id <> private.me() and now() > lower(b.during) - make_interval(hours => m.cancel_hours) then
    raise exception 'Trop tard pour annuler en ligne (moins de % h avant) : prévenez le professeur par message.', m.cancel_hours;
  end if;
  update public.meeting_bookings set cancelled_at = now(), cancelled_by = private.me() where id = p_booking;
  perform private.notify_meeting(p_booking, true);
end $$;

create or replace function private.notify_meeting(p_booking uuid, p_cancelled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare b record; v_when text; v_id uuid; v_actor uuid := private.me();
begin
  select mb.*, m.school_id, m.title, st.display_name as student_name, t.display_name as teacher_name,
         par.display_name as parent_name, s.place, s.visio_url, s.starts_at
    into b
    from public.meeting_bookings mb join public.parent_meetings m on m.id = mb.meeting_id
    join public.meeting_slots s on s.id = mb.slot_id
    join public.profiles st on st.id = mb.student_id join public.profiles t on t.id = mb.teacher_id
    join public.profiles par on par.id = mb.parent_id
   where mb.id = p_booking;
  v_when := to_char(b.starts_at at time zone 'Europe/Paris', 'DD/MM à HH24"h"MI')
            || coalesce(' · ' || b.place, '') || coalesce(' · visio : ' || b.visio_url, '');
  -- Au professeur.
  if b.teacher_id <> v_actor then
    insert into public.messages (school_id, sender_id, subject, body)
    values (b.school_id, coalesce(v_actor, b.parent_id),
      case when p_cancelled then 'Rendez-vous annulé · ' else 'Rendez-vous réservé · ' end || b.student_name,
      'Bonjour,' || E'\n\n' || case when p_cancelled then 'Le rendez-vous suivant est annulé : ' else 'Nouveau rendez-vous : ' end
      || b.title || ', le ' || v_when || case when b.parent_id = b.student_id then ', avec ' || b.student_name || ' (réservé par l''élève).' else ', avec ' || b.parent_name || ' pour ' || b.student_name || '.' end)
    returning id into v_id;
    insert into public.message_recipients (message_id, recipient_id) values (v_id, b.teacher_id);
  end if;
  -- Aux responsables de l'élève.
  insert into public.messages (school_id, sender_id, subject, body)
  values (b.school_id, b.teacher_id,
    case when p_cancelled then 'Rendez-vous annulé · ' else 'Rendez-vous confirmé · ' end || b.teacher_name,
    'Bonjour,' || E'\n\n' || case when p_cancelled then 'Le rendez-vous suivant est annulé : ' else 'Votre rendez-vous est confirmé : ' end
    || b.title || ', le ' || v_when || ', avec ' || b.teacher_name || ' pour ' || b.student_name || '.'
    || case when p_cancelled then '' else E'\n\n' || 'Retrouvez votre parcours dans Préau : Réunions parents-profs.' end)
  returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select v_id, g.guardian_id from public.guardians g where g.student_id = b.student_id and g.guardian_id <> b.teacher_id
  on conflict do nothing;
  -- L'élève qui a réservé lui-même.
  if b.parent_id <> b.teacher_id then
    insert into public.message_recipients (message_id, recipient_id) values (v_id, b.parent_id) on conflict do nothing;
  end if;
end $$;
