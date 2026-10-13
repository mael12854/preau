-- Supprimer un cours (secrétariat). Un cours dont l'appel est fait ne se supprime pas : on l'annule.
create or replace function public.delete_lesson(p_lesson uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_l public.lessons;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat modifie l''emploi du temps.' using errcode = '42501';
  end if;
  select l.* into v_l from public.lessons l join public.classes c on c.id = l.class_id
   where l.id = p_lesson and c.school_id = private.my_school();
  if v_l.id is null then raise exception 'Cours introuvable' using errcode = '42501'; end if;
  if exists (select 1 from public.attendance a where a.lesson_id = p_lesson) then
    raise exception 'L''appel de ce cours est déjà fait : annulez-le plutôt que de le supprimer.';
  end if;
  delete from public.lessons where id = p_lesson;
end $$;
revoke all on function public.delete_lesson(uuid) from public, anon;
grant execute on function public.delete_lesson(uuid) to authenticated;
