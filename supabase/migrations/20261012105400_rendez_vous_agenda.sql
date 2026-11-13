-- Rendez-vous parents-profs dans l'agenda : seulement celui du professeur et celui du parent qui a réservé.
create or replace function public.my_meeting_appointments(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', b.id,
           'meeting_id', b.meeting_id,
           'title', m.title,
           'starts_at', s.starts_at,
           'ends_at', s.ends_at,
           'place', s.place,
           'visio_url', s.visio_url,
           'teacher', t.display_name,
           'student', st.display_name,
           'parent', par.display_name,
           'as_teacher', b.teacher_id = private.me())
         order by s.starts_at), '[]'::jsonb)
  from public.meeting_bookings b
  join public.meeting_slots s on s.id = b.slot_id
  join public.parent_meetings m on m.id = b.meeting_id
  join public.profiles t on t.id = b.teacher_id
  join public.profiles st on st.id = b.student_id
  join public.profiles par on par.id = b.parent_id
  where b.cancelled_at is null
    and private.me() is not null
    and (b.teacher_id = private.me() or b.parent_id = private.me())
    and (s.starts_at at time zone 'Europe/Paris')::date between p_from and p_to
$$;
revoke all on function public.my_meeting_appointments(date, date) from public, anon;
grant execute on function public.my_meeting_appointments(date, date) to authenticated;
