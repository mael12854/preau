-- Demi-groupes : des groupes par classe (G1, G2…), un groupe au plus par élève et par classe,
-- et des cours qui peuvent viser un groupe plutôt que la classe entière.
-- EDT général (classe) : tous les cours. EDT nominatif (élève, famille) : classe entière + son groupe.

create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 20),
  unique (class_id, name)
);

-- Le groupe d'un élève dans une classe (classe principale ou supplémentaire). group_id nul : sans groupe.
create table public.student_class_groups (
  student_id uuid not null references public.students (profile_id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  group_id uuid references public.class_groups (id) on delete set null,
  primary key (student_id, class_id)
);

alter table public.lessons add column group_id uuid references public.class_groups (id) on delete set null;

alter table public.class_groups enable row level security;
alter table public.student_class_groups enable row level security;
revoke all on public.class_groups, public.student_class_groups from anon;
revoke insert, update, delete, truncate on public.class_groups, public.student_class_groups from authenticated;
grant select on public.class_groups, public.student_class_groups to authenticated;
create policy "groupes des classes visibles" on public.class_groups for select to authenticated
  using ((select private.can_see_class(class_id)));
create policy "groupe des élèves visibles" on public.student_class_groups for select to authenticated
  using ((select private.can_see_student(student_id)));

-- Créer les groupes d'une classe (secrétariat) : p_names, par exemple {G1,G2}. Les groupes existants restent.
create or replace function public.create_class_groups(p_class uuid, p_names text[])
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat organise les groupes.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes where id = p_class and school_id = private.my_school()) then
    raise exception 'Classe introuvable' using errcode = '42501';
  end if;
  insert into public.class_groups (class_id, name)
  select p_class, trim(n) from unnest(p_names) n where trim(n) <> ''
  on conflict (class_id, name) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Placer un élève dans un groupe de la classe (p_group nul : sans groupe).
create or replace function public.set_student_group(p_student uuid, p_class uuid, p_group uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat organise les groupes.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes where id = p_class and school_id = private.my_school())
     or not private.in_class(p_student, p_class) then
    raise exception 'Élève ou classe introuvable' using errcode = '42501';
  end if;
  if p_group is not null and not exists (select 1 from public.class_groups where id = p_group and class_id = p_class) then
    raise exception 'Groupe introuvable' using errcode = '42501';
  end if;
  insert into public.student_class_groups (student_id, class_id, group_id) values (p_student, p_class, p_group)
  on conflict (student_id, class_id) do update set group_id = excluded.group_id;
end $$;

-- Créer une série de cours, éventuellement pour un groupe (secrétariat). Mêmes règles que create_lessons.
create or replace function public.create_lesson_set(
  p_class uuid, p_subject text, p_teacher uuid, p_room text,
  p_weekday smallint, p_starts time, p_ends time, p_from date, p_until date,
  p_recurrence text, p_nth smallint, p_group uuid
) returns integer language plpgsql security definer set search_path = '' as $$
declare v_school uuid := private.my_school(); v_series uuid := gen_random_uuid(); v_count integer;
  v_c public.classes; v_teacher uuid := p_teacher;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat construit l''emploi du temps.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from v_school then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if p_group is not null and not exists (select 1 from public.class_groups where id = p_group and class_id = p_class) then
    raise exception 'Groupe introuvable' using errcode = '42501';
  end if;
  if v_c.level = 'primaire' then
    v_teacher := v_c.teacher_id;
    if v_teacher is null then raise exception 'Cette classe n''a pas encore de titulaire : confiez-la à un enseignant dans l''Annuaire.'; end if;
  end if;
  if not exists (select 1 from public.subjects where id = p_subject) then raise exception 'Choisissez une matière.'; end if;
  if not exists (select 1 from public.profiles where id = v_teacher and kind = 'prof' and school_id = v_school) then
    raise exception 'Choisissez un enseignant de l''établissement.';
  end if;
  if coalesce(trim(p_room), '') = '' or length(p_room) > 40 then raise exception 'Indiquez une salle (40 caractères au plus).'; end if;
  if p_recurrence not in ('weekly', 'week_a', 'week_b', 'monthly', 'daily') then raise exception 'Récurrence invalide.'; end if;
  if p_recurrence <> 'daily' and (p_weekday is null or p_weekday not between 1 and 7) then raise exception 'Jour invalide.'; end if;
  if p_recurrence = 'monthly' and (p_nth is null or p_nth not between 1 and 5) then raise exception 'Choisissez la semaine du mois.'; end if;
  if p_starts is null or p_ends is null or p_ends <= p_starts then raise exception 'L''heure de fin doit suivre l''heure de début.'; end if;
  if p_from is null or p_until is null or p_until < p_from then raise exception 'La fin de la période précède son début.'; end if;
  if p_until > p_from + 400 then raise exception 'Une série couvre une année scolaire au plus.'; end if;

  insert into public.lessons (class_id, subject_id, teacher_id, room, starts_at, ends_at, series_id, created_by, group_id)
  select p_class, p_subject, v_teacher, trim(p_room),
         (d + p_starts) at time zone 'Europe/Paris', (d + p_ends) at time zone 'Europe/Paris', v_series, private.me(), p_group
  from generate_series(p_from, p_until, interval '1 day') g(day), lateral (select g.day::date as d) x
  where (p_recurrence = 'daily' or extract(isodow from d) = p_weekday)
    and (p_recurrence <> 'week_a' or private.week_ab(v_school, d) = 'A')
    and (p_recurrence <> 'week_b' or private.week_ab(v_school, d) = 'B')
    and (p_recurrence <> 'monthly'
         or (p_nth between 1 and 4 and (extract(day from d)::int - 1) / 7 + 1 = p_nth)
         or (p_nth = 5 and extract(month from d + 7) <> extract(month from d)))
    and not exists (
      select 1 from public.agenda_events e
      where e.school_id = v_school and e.is_holiday and e.class_id is null
        and d between e.starts_on and coalesce(e.ends_on, e.starts_on));
  get diagnostics v_count = row_count;

  if v_c.level <> 'primaire' then
    insert into public.teachings (class_id, subject_id, teacher_id) values (p_class, p_subject, v_teacher)
    on conflict (class_id, subject_id) do nothing;
  end if;
  return v_count;
end $$;

-- Changer le groupe d'un cours, ou de ce cours et des suivants de la série (secrétariat).
create or replace function public.set_lesson_group(p_lesson uuid, p_group uuid, p_scope text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_l public.lessons; v_count integer;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat modifie l''emploi du temps.' using errcode = '42501';
  end if;
  select l.* into v_l from public.lessons l join public.classes c on c.id = l.class_id
   where l.id = p_lesson and c.school_id = private.my_school();
  if v_l.id is null then raise exception 'Cours introuvable' using errcode = '42501'; end if;
  if p_group is not null and not exists (select 1 from public.class_groups where id = p_group and class_id = v_l.class_id) then
    raise exception 'Groupe introuvable' using errcode = '42501';
  end if;
  update public.lessons set group_id = p_group
   where id = p_lesson or (p_scope = 'following' and series_id = v_l.series_id and starts_at >= v_l.starts_at);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- L'appel d'un cours de groupe ne concerne que les élèves du groupe.
create or replace function private.in_lesson(p_student uuid, p_lesson uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lessons l
    where l.id = p_lesson and private.in_class(p_student, l.class_id)
      and (l.group_id is null or exists (
        select 1 from public.student_class_groups g where g.student_id = p_student and g.class_id = l.class_id and g.group_id = l.group_id)))
$$;

create or replace function public.validate_attendance(p_lesson uuid, p_statuses jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_lesson public.lessons;
  v_me uuid := private.me();
begin
  if v_me is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_lesson from public.lessons where id = p_lesson;
  if v_lesson.id is null then raise exception 'Cours introuvable'; end if;
  if v_lesson.teacher_id is distinct from v_me
     and not coalesce(private.my_kind() = 'cpe' and private.can_see_class(v_lesson.class_id), false) then
    raise exception 'Vous ne pouvez pas faire l''appel de ce cours' using errcode = '42501';
  end if;
  insert into public.attendance (lesson_id, student_id, status, recorded_by)
  select p_lesson, s.profile_id, (p_statuses ->> s.profile_id::text)::public.attendance_status, v_me
  from public.students s
  where private.in_lesson(s.profile_id, p_lesson) and p_statuses ? s.profile_id::text
  on conflict (lesson_id, student_id) do update
    set status = excluded.status, recorded_by = excluded.recorded_by, recorded_at = now();
  update public.lessons set attendance_validated_at = now() where id = p_lesson;
end $$;

revoke all on function public.create_class_groups(uuid, text[]) from public, anon;
revoke all on function public.set_student_group(uuid, uuid, uuid) from public, anon;
revoke all on function public.create_lesson_set(uuid, text, uuid, text, smallint, time, time, date, date, text, smallint, uuid) from public, anon;
revoke all on function public.set_lesson_group(uuid, uuid, text) from public, anon;
revoke all on function private.in_lesson(uuid, uuid) from public, anon;
grant execute on function public.create_class_groups(uuid, text[]) to authenticated;
grant execute on function public.set_student_group(uuid, uuid, uuid) to authenticated;
grant execute on function public.create_lesson_set(uuid, text, uuid, text, smallint, time, time, date, date, text, smallint, uuid) to authenticated;
grant execute on function public.set_lesson_group(uuid, uuid, text) to authenticated;
grant execute on function private.in_lesson(uuid, uuid) to authenticated;
