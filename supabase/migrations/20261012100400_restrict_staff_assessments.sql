-- Évaluations : le secrétariat n'y a pas accès ; CPE et direction ne voient que les évaluations publiées
-- (les saisies en cours restent visibles du seul professeur).
drop policy "évaluations visibles" on public.assessments;
create policy "évaluations visibles" on public.assessments for select to authenticated
  using (teacher_id = (select private.me())
      or (published_at is not null and (select private.can_see_class(class_id))
          and ((select private.my_kind()) <> 'secretariat')));

drop policy "résultats visibles" on public.assessment_results;
create policy "résultats visibles" on public.assessment_results for select to authenticated
  using (exists (
    select 1 from public.assessments a where a.id = assessment_id and (
         a.teacher_id = (select private.me())
      or (a.published_at is not null and (
             (select private.is_family_of(student_id))
          or ((select private.my_kind()) in ('cpe', 'direction') and (select private.can_see_student(student_id))))))));
