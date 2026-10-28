-- EDT général pour tout compte à plusieurs fiches : ses cours de professeur, ses cours d'élève,
-- et ceux de ses enfants (fiches de responsable), toutes écoles confondues.
create or replace function public.my_all_lessons(p_from timestamptz, p_to timestamptz)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, room text, cancelled boolean, series_id uuid,
  teacher_id uuid, group_id uuid, subject_id text, subject_name text, subject_hue integer, class_name text,
  group_name text, school_name text, teacher_name text, who text, role text)
language sql stable security definer set search_path = '' as $$
  with mine as (
    select p.id, p.kind from public.profiles p
    where auth.uid() is not null
      and (p.user_id = auth.uid() or p.id in (select pl.profile_id from public.profile_links pl where pl.user_id = auth.uid()))
  ),
  -- Personnes dont on suit les cours : soi comme élève, ses enfants comme responsable.
  pupils as (
    select m.id as student_id, null::text as who from mine m where m.kind = 'eleve'
    union
    select g.student_id, sp.first_name from mine m
      join public.guardians g on g.guardian_id = m.id join public.profiles sp on sp.id = g.student_id
    where m.kind = 'parent'
  ),
  rows as (
    select l.id, 'prof'::text as role, null::text as who from public.lessons l join mine m on m.id = l.teacher_id and m.kind = 'prof'
    where l.starts_at >= p_from and l.starts_at < p_to
    union
    select l.id, 'eleve', p.who from public.lessons l
      join pupils p on private.in_lesson(p.student_id, l.id)
    where l.starts_at >= p_from and l.starts_at < p_to
  )
  select l.id, l.starts_at, l.ends_at, l.room, l.cancelled, l.series_id, l.teacher_id, l.group_id,
         s.id, s.name, s.hue::integer, c.name, g.name, sc.name, t.display_name, r.who, r.role
  from rows r
  join public.lessons l on l.id = r.id
  join public.classes c on c.id = l.class_id and not c.hidden
  join public.schools sc on sc.id = c.school_id
  join public.subjects s on s.id = l.subject_id
  join public.profiles t on t.id = l.teacher_id
  left join public.class_groups g on g.id = l.group_id
  order by l.starts_at
$$;

revoke execute on function public.my_all_lessons(timestamptz, timestamptz) from public, anon;
grant execute on function public.my_all_lessons(timestamptz, timestamptz) to authenticated;
