-- Emploi du temps : seul le secrétariat le construit (la direction le consulte).
-- Primaire : l'emploi du temps est celui de la classe, et ses cours sont ceux du titulaire.

create or replace function public.create_lesson_series(
  p_class uuid, p_subject text, p_teacher uuid, p_room text,
  p_weekday smallint, p_starts time, p_ends time, p_from date, p_until date
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
    -- Primaire : toujours le titulaire de la classe, quel que soit l'enseignant demandé.
    v_teacher := v_c.teacher_id;
    if v_teacher is null then raise exception 'Cette classe n''a pas encore de titulaire : confiez-la à un enseignant dans l''Annuaire.'; end if;
  end if;
  if not exists (select 1 from public.subjects where id = p_subject) then raise exception 'Choisissez une matière.'; end if;
  if not exists (select 1 from public.profiles where id = v_teacher and kind = 'prof' and school_id = v_school) then
    raise exception 'Choisissez un enseignant de l''établissement.';
  end if;
  if coalesce(trim(p_room), '') = '' or length(p_room) > 40 then raise exception 'Indiquez une salle (40 caractères au plus).'; end if;
  if p_weekday not between 1 and 7 then raise exception 'Jour invalide.'; end if;
  if p_starts is null or p_ends is null or p_ends <= p_starts then raise exception 'L''heure de fin doit suivre l''heure de début.'; end if;
  if p_from is null or p_until is null or p_until < p_from then raise exception 'La fin de la période précède son début.'; end if;
  if p_until > p_from + 400 then raise exception 'Une série couvre une année scolaire au plus.'; end if;

  insert into public.lessons (class_id, subject_id, teacher_id, room, starts_at, ends_at, series_id, created_by)
  select p_class, p_subject, v_teacher, trim(p_room),
         (d + p_starts) at time zone 'Europe/Paris', (d + p_ends) at time zone 'Europe/Paris', v_series, private.me()
  from generate_series(p_from, p_until, interval '1 day') g(day), lateral (select g.day::date as d) x
  where extract(isodow from d) = p_weekday
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

-- Annuler ou rétablir un cours : son enseignant, ou le secrétariat de l'établissement.
create or replace function public.set_lesson_cancelled(p_lesson uuid, p_cancelled boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_l public.lessons;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_l from public.lessons where id = p_lesson;
  if v_l.id is null or not coalesce(v_l.teacher_id = private.me()
       or (private.my_kind() = 'secretariat' and private.can_see_class(v_l.class_id)), false) then
    raise exception 'Cours introuvable' using errcode = '42501';
  end if;
  update public.lessons set cancelled = coalesce(p_cancelled, true) where id = p_lesson;
end $$;
