-- Le professeur modifie une de ses évaluations : titre, date, trimestre, compétences.
-- Les pastilles déjà saisies suivent leur compétence (par son nom) ; une compétence nouvelle part de « non évalué ».
create or replace function public.update_assessment(
  p_assessment uuid, p_title text, p_held_on date, p_term smallint, p_skills text[] default '{}')
returns void language plpgsql security definer set search_path = '' as $$
declare v_a public.assessments; v_grading text; v_skills text[];
begin
  select * into v_a from public.assessments where id = p_assessment;
  if private.me() is null or v_a.id is null or v_a.teacher_id is distinct from private.me() then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à l''évaluation.'; end if;
  if p_held_on is null then raise exception 'Indiquez la date de l''évaluation.'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  select s.grading::text into v_grading from public.classes c join public.schools s on s.id = c.school_id where c.id = v_a.class_id;
  select coalesce(array_agg(trim(x) order by n) filter (where trim(x) <> ''), '{}') into v_skills
    from unnest(coalesce(p_skills, '{}')) with ordinality as u(x, n);
  if v_grading = 'note20' then
    v_skills := '{}';
  elsif cardinality(v_skills) = 0 then
    raise exception 'Ajoutez au moins une compétence évaluée.';
  elsif cardinality(v_skills) > 12 then
    raise exception '12 compétences au plus.';
  end if;

  if v_skills is distinct from v_a.skills then
    update public.assessment_results r
       set skill_levels = coalesce((
             select array_agg(coalesce(r.skill_levels[array_position(v_a.skills, s.name)], 'NE') order by s.n)
               from unnest(v_skills) with ordinality as s(name, n)), '{}'),
           updated_at = now()
     where r.assessment_id = p_assessment;
  end if;

  update public.assessments
     set title = left(trim(p_title), 120), held_on = p_held_on, term = p_term, skills = v_skills
   where id = p_assessment;
end $$;

revoke execute on function public.update_assessment(uuid, text, date, smallint, text[]) from public, anon;
grant execute on function public.update_assessment(uuid, text, date, smallint, text[]) to authenticated;
