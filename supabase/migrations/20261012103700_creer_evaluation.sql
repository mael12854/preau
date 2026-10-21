-- Le professeur crée ses évaluations (classe et matière qu'il enseigne). Compétences : au moins une ; notes sur 20 : aucune.
create or replace function public.create_assessment(
  p_class uuid, p_subject text, p_title text, p_held_on date, p_term smallint, p_skills text[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.me(); v_grading text; v_skills text[]; v_id uuid;
begin
  if v_me is null or private.my_kind() <> 'prof' then raise exception 'Réservé aux professeurs' using errcode = '42501'; end if;
  if not private.gives_subject(v_me, p_class, p_subject) then
    raise exception 'Vous n''enseignez pas cette matière dans cette classe' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à l''évaluation.'; end if;
  if p_held_on is null then raise exception 'Indiquez la date de l''évaluation.'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  select s.grading::text into v_grading from public.classes c join public.schools s on s.id = c.school_id where c.id = p_class;
  select coalesce(array_agg(trim(x)) filter (where trim(x) <> ''), '{}') into v_skills from unnest(coalesce(p_skills, '{}')) x;
  if v_grading = 'note20' then
    v_skills := '{}';
  elsif cardinality(v_skills) = 0 then
    raise exception 'Ajoutez au moins une compétence évaluée.';
  elsif cardinality(v_skills) > 12 then
    raise exception '12 compétences au plus.';
  end if;
  insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills)
  values (p_class, p_subject, v_me, left(trim(p_title), 120), p_held_on, p_term, v_skills)
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.create_assessment(uuid, text, text, date, smallint, text[]) from public, anon;
grant execute on function public.create_assessment(uuid, text, text, date, smallint, text[]) to authenticated;
