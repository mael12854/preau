-- Retirer une série de cours (direction, secrétariat) : les cours à venir de la série, à partir de p_from.
-- Les cours passés restent, avec leur appel.
create or replace function public.delete_lesson_series(p_series uuid, p_from date)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat construisent l''emploi du temps.' using errcode = '42501';
  end if;
  delete from public.lessons l
   using public.classes c
   where l.series_id = p_series and c.id = l.class_id and c.school_id = private.my_school()
     and l.starts_at >= (coalesce(p_from, current_date)::timestamp at time zone 'Europe/Paris')
     and not exists (select 1 from public.attendance a where a.lesson_id = l.id);
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.delete_lesson_series(uuid, date) from public, anon;
grant execute on function public.delete_lesson_series(uuid, date) to authenticated;
