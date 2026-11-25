-- Plusieurs bulletins par trimestre, partie 2 (à lancer dans l'éditeur SQL de Supabase) :
-- retire l'ancienne règle « un seul bulletin par élève et par trimestre » (remplacée par l'index avec le n° de bulletin),
-- et la suppression des bulletins d'une classe vise un bulletin précis du trimestre.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.report_cards'::regclass and contype = 'u'
       and pg_get_constraintdef(oid) = 'UNIQUE (student_id, school_year, term)'
  loop
    execute format('alter table public.report_cards drop constraint %I', c);
  end loop;
end $$;

create or replace function public.delete_report_cards(p_class uuid, p_term smallint, p_seq smallint)
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
   where rc.school_year = v_year and rc.term = p_term and rc.seq = coalesce(p_seq, 1) and private.in_class(rc.student_id, p_class);
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.delete_report_cards(uuid, smallint, smallint) from public, anon;
grant execute on function public.delete_report_cards(uuid, smallint, smallint) to authenticated;
