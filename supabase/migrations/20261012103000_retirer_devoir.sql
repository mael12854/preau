-- Retirer un devoir qu'on a donné (les coches des élèves partent avec).
create or replace function public.remove_homework(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.homework where id = p_id and teacher_id = private.me()) then
    raise exception 'Devoir introuvable' using errcode = '42501';
  end if;
  delete from public.homework_done where homework_id = p_id;
  delete from public.homework where id = p_id;
end $$;

revoke all on function public.remove_homework(uuid) from public, anon;
grant execute on function public.remove_homework(uuid) to authenticated;
