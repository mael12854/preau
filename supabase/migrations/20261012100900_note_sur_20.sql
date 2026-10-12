-- Notation par établissement : compétences (par défaut) ou note sur 20.
-- Exception voulue à la règle d'origine : seuls les établissements réglés sur « note20 »
-- stockent une note. Même là, aucune moyenne ni aucun rang n'est calculé ni stocké.
create type public.grading_mode as enum ('competences', 'note20');
alter table public.schools add column grading public.grading_mode not null default 'competences';

alter table public.assessment_results add column score numeric(4,2)
  check (score is null or (score between 0 and 20 and score * 2 = round(score * 2)));

-- Saisir la note d'un élève (professeur de l'évaluation, établissement noté sur 20).
-- p_score nul : non noté ; p_status 'ABS' ou 'DISP' pour un élève absent ou dispensé.
create or replace function public.set_assessment_score(
  p_assessment uuid, p_student uuid, p_score numeric, p_status public.eval_value default 'NE'
) returns void language plpgsql security definer set search_path = '' as $$
declare v_a public.assessments;
begin
  select * into v_a from public.assessments where id = p_assessment;
  if v_a.id is null or v_a.teacher_id <> private.me() then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  if (select s.grading from public.classes c join public.schools s on s.id = c.school_id where c.id = v_a.class_id) <> 'note20' then
    raise exception 'Cet établissement évalue par compétences';
  end if;
  if not exists (select 1 from public.students where profile_id = p_student and class_id = v_a.class_id) then
    raise exception 'Cet élève n''est pas dans la classe';
  end if;
  if p_status not in ('NE', 'ABS', 'DISP') then raise exception 'Statut invalide'; end if;
  insert into public.assessment_results (assessment_id, student_id, level, score)
  values (p_assessment, p_student, case when p_score is null then p_status else 'NE' end, p_score)
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, level = excluded.level, updated_at = now();
end $$;
revoke all on function public.set_assessment_score(uuid, uuid, numeric, public.eval_value) from public, anon;
grant execute on function public.set_assessment_score(uuid, uuid, numeric, public.eval_value) to authenticated;

update public.schools set grading = 'note20' where name = 'Collège du Weekend';
