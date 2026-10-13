-- Supprimer des bulletins (direction, secrétariat) : leurs lignes et l'avis du conseil partent avec.

-- Le bulletin d'un élève.
create or replace function public.delete_report_card(p_report_card uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rc public.report_cards;
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat suppriment des bulletins.' using errcode = '42501';
  end if;
  select * into v_rc from public.report_cards where id = p_report_card;
  if v_rc.id is null or not exists (
       select 1 from public.profiles p where p.id = v_rc.student_id and p.school_id = private.my_school()) then
    raise exception 'Bulletin introuvable' using errcode = '42501';
  end if;
  delete from public.report_cards where id = p_report_card;
end $$;

-- Les bulletins d'une classe pour un trimestre (élèves de la classe, classes supplémentaires comprises).
create or replace function public.delete_report_cards(p_class uuid, p_term smallint)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_c public.classes; v_year text; v_count integer;
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat suppriment des bulletins.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  select regexp_replace(year_label, '^\D*', '') into v_year from public.schools where id = v_c.school_id;
  delete from public.report_cards rc
   where rc.school_year = v_year and rc.term = p_term and private.in_class(rc.student_id, p_class);
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.delete_report_card(uuid) from public, anon;
revoke all on function public.delete_report_cards(uuid, smallint) from public, anon;
grant execute on function public.delete_report_card(uuid) to authenticated;
grant execute on function public.delete_report_cards(uuid, smallint) to authenticated;
