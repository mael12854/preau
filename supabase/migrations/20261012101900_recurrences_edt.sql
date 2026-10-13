-- Emploi du temps : récurrences des séries de cours.
--   weekly  : chaque semaine, le jour choisi
--   week_a / week_b : une semaine sur deux, en semaines calendaires (vacances comprises). Chaque
--             établissement a une semaine A de référence (schools.week_a_monday) ; A, B, A, B… à partir d'elle.
--   monthly : tous les mois, le n-ième jour choisi du mois (p_nth : 1 à 4, ou 5 = le dernier)
--   daily   : tous les jours de la période
-- Les vacances de l'agenda (tout l'établissement) sont toujours sautées.

-- Semaine A de référence de l'établissement (un lundi). Semaine du 12 octobre 2026 = semaine A.
alter table public.schools add column week_a_monday date not null default '2026-10-12'
  check (extract(isodow from week_a_monday) = 1);

-- Semaine A ou B d'un jour donné, pour un établissement.
create or replace function private.week_ab(p_school uuid, p_day date) returns text
language sql stable security definer set search_path = '' as $$
  select case when (((p_day - (extract(isodow from p_day)::int - 1)) - s.week_a_monday) / 7) % 2 = 0 then 'A' else 'B' end
  from public.schools s where s.id = p_school
$$;
revoke all on function private.week_ab(uuid, date) from public, anon;
grant execute on function private.week_ab(uuid, date) to authenticated;

create or replace function public.create_lessons(
  p_class uuid, p_subject text, p_teacher uuid, p_room text,
  p_weekday smallint, p_starts time, p_ends time, p_from date, p_until date,
  p_recurrence text, p_nth smallint
) returns integer language plpgsql security definer set search_path = '' as $$
declare v_school uuid := private.my_school(); v_series uuid := gen_random_uuid(); v_count integer;
  v_c public.classes; v_teacher uuid := p_teacher;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat construit l''emploi du temps.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from v_school then raise exception 'Classe introuvable' using errcode = '42501'; end if;
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

  insert into public.lessons (class_id, subject_id, teacher_id, room, starts_at, ends_at, series_id, created_by)
  select p_class, p_subject, v_teacher, trim(p_room),
         (d + p_starts) at time zone 'Europe/Paris', (d + p_ends) at time zone 'Europe/Paris', v_series, private.me()
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

revoke all on function public.create_lessons(uuid, text, uuid, text, smallint, time, time, date, date, text, smallint) from public, anon;
grant execute on function public.create_lessons(uuid, text, uuid, text, smallint, time, time, date, date, text, smallint) to authenticated;
-- L'ancienne create_lesson_series (chaque semaine) reste en place ; l'application utilise create_lessons.
