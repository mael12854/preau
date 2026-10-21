-- Le professeur supprime une de ses évaluations, avec les résultats déjà saisis (publiée ou non).
create or replace function public.delete_assessment(p_assessment uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.me() is null or not exists (
    select 1 from public.assessments where id = p_assessment and teacher_id = private.me()) then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  delete from public.assessment_results where assessment_id = p_assessment;
  delete from public.assessments where id = p_assessment;
end $$;

revoke execute on function public.delete_assessment(uuid) from public, anon;
grant execute on function public.delete_assessment(uuid) to authenticated;
