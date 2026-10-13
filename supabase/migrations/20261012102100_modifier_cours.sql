-- Modifier un cours (secrétariat) : matière, enseignant, salle, horaires, date.
-- p_scope 'one' : ce cours seulement (la date peut changer) ;
-- p_scope 'following' : ce cours et les suivants de la même série (même horaire, la date ne change pas).
-- Primaire : l'enseignant reste le titulaire de la classe.
create or replace function public.update_lesson(
  p_lesson uuid, p_subject text, p_teacher uuid, p_room text,
  p_day date, p_starts time, p_ends time, p_scope text
) returns integer language plpgsql security definer set search_path = '' as $$
declare v_l public.lessons; v_c public.classes; v_teacher uuid := p_teacher; v_count integer;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat modifie l''emploi du temps.' using errcode = '42501';
  end if;
  select * into v_l from public.lessons where id = p_lesson;
  select * into v_c from public.classes where id = v_l.class_id;
  if v_l.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Cours introuvable' using errcode = '42501'; end if;
  if v_c.level = 'primaire' then v_teacher := v_c.teacher_id; end if;
  if not exists (select 1 from public.subjects where id = p_subject) then raise exception 'Choisissez une matière.'; end if;
  if not exists (select 1 from public.profiles where id = v_teacher and kind = 'prof' and school_id = v_c.school_id) then
    raise exception 'Choisissez un enseignant de l''établissement.';
  end if;
  if coalesce(trim(p_room), '') = '' or length(p_room) > 40 then raise exception 'Indiquez une salle (40 caractères au plus).'; end if;
  if p_starts is null or p_ends is null or p_ends <= p_starts then raise exception 'L''heure de fin doit suivre l''heure de début.'; end if;
  if p_scope not in ('one', 'following') then raise exception 'Portée invalide.'; end if;

  if p_scope = 'one' or v_l.series_id is null then
    if p_day is null then raise exception 'Indiquez la date du cours.'; end if;
    update public.lessons
       set subject_id = p_subject, teacher_id = v_teacher, room = trim(p_room),
           starts_at = (p_day + p_starts) at time zone 'Europe/Paris', ends_at = (p_day + p_ends) at time zone 'Europe/Paris'
     where id = p_lesson;
  else
    -- Chaque cours garde sa date ; seuls l'horaire, la matière, l'enseignant et la salle changent.
    update public.lessons l
       set subject_id = p_subject, teacher_id = v_teacher, room = trim(p_room),
           starts_at = ((l.starts_at at time zone 'Europe/Paris')::date + p_starts) at time zone 'Europe/Paris',
           ends_at = ((l.starts_at at time zone 'Europe/Paris')::date + p_ends) at time zone 'Europe/Paris'
     where l.series_id = v_l.series_id and l.starts_at >= v_l.starts_at;
  end if;
  get diagnostics v_count = row_count;
  if v_c.level <> 'primaire' then
    insert into public.teachings (class_id, subject_id, teacher_id) values (v_c.id, p_subject, v_teacher)
    on conflict (class_id, subject_id) do nothing;
  end if;
  return v_count;
end $$;

revoke all on function public.update_lesson(uuid, text, uuid, text, date, time, time, text) from public, anon;
grant execute on function public.update_lesson(uuid, text, uuid, text, date, time, time, text) to authenticated;
