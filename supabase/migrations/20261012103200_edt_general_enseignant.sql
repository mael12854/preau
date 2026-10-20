-- EDT général d'un enseignant qui enseigne dans plusieurs établissements (un compte, plusieurs fiches) :
-- les cours de toutes ses fiches d'enseignant, classes masquées exclues.
create or replace function public.my_teaching_lessons(p_from timestamptz, p_to timestamptz)
returns table (
  id uuid, starts_at timestamptz, ends_at timestamptz, room text, cancelled boolean,
  series_id uuid, teacher_id uuid, group_id uuid,
  subject_id text, subject_name text, subject_hue integer,
  class_name text, group_name text, school_name text, teacher_name text
) language sql stable security definer set search_path = '' as $$
  with mine as (
    select p.id from public.profiles p
    where p.kind = 'prof' and auth.uid() is not null
      and (p.user_id = auth.uid() or p.id in (select pl.profile_id from public.profile_links pl where pl.user_id = auth.uid()))
  )
  select l.id, l.starts_at, l.ends_at, l.room, l.cancelled, l.series_id, l.teacher_id, l.group_id,
         s.id, s.name, s.hue::integer, c.name, g.name, sc.name, t.display_name
  from public.lessons l
  join mine m on m.id = l.teacher_id
  join public.classes c on c.id = l.class_id and not c.hidden
  join public.schools sc on sc.id = c.school_id
  join public.subjects s on s.id = l.subject_id
  join public.profiles t on t.id = l.teacher_id
  left join public.class_groups g on g.id = l.group_id
  where l.starts_at >= p_from and l.starts_at < p_to
  order by l.starts_at
$$;
revoke all on function public.my_teaching_lessons(timestamptz, timestamptz) from public, anon;
grant execute on function public.my_teaching_lessons(timestamptz, timestamptz) to authenticated;
