-- Retirer un élève d'une classe supplémentaire (secrétariat, direction).
create or replace function public.remove_class_member(p_student uuid, p_class uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.manageable_person(p_student);
  delete from public.class_members where student_id = p_student and class_id = p_class;
end $$;

revoke all on function public.remove_class_member(uuid, uuid) from public, anon;
grant execute on function public.remove_class_member(uuid, uuid) to authenticated;
