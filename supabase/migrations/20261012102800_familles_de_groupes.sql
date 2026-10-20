-- Familles de groupes : un élève a au plus un groupe par famille et par classe.
-- Exemples : « Demi-groupe » (G1, G2), « LV2 » (Espagnol, Allemand), « LV3 » (Italien, au choix).

alter table public.class_groups add column family text not null default 'Demi-groupe'
  check (length(trim(family)) between 1 and 30);
alter table public.student_class_groups add column family text not null default 'Demi-groupe';
alter table public.student_class_groups drop constraint student_class_groups_pkey;
alter table public.student_class_groups add primary key (student_id, class_id, family);

-- Créer les groupes d'une famille dans une classe (secrétariat). Les groupes existants restent.
create or replace function public.create_class_groups(p_class uuid, p_family text, p_names text[])
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat organise les groupes.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes where id = p_class and school_id = private.my_school()) then
    raise exception 'Classe introuvable' using errcode = '42501';
  end if;
  if coalesce(trim(p_family), '') = '' or length(p_family) > 30 then raise exception 'Nommez la famille de groupes.'; end if;
  insert into public.class_groups (class_id, family, name)
  select p_class, trim(p_family), trim(n) from unnest(p_names) n where trim(n) <> ''
  on conflict (class_id, name) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Placer un élève dans un groupe d'une famille (p_group nul : aucun groupe de cette famille).
create or replace function public.set_student_group(p_student uuid, p_class uuid, p_family text, p_group uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.me() is null or private.my_kind() <> 'secretariat' then
    raise exception 'Seul le secrétariat organise les groupes.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.classes where id = p_class and school_id = private.my_school())
     or not private.in_class(p_student, p_class) then
    raise exception 'Élève ou classe introuvable' using errcode = '42501';
  end if;
  if p_group is not null and not exists (
    select 1 from public.class_groups where id = p_group and class_id = p_class and family = p_family) then
    raise exception 'Groupe introuvable' using errcode = '42501';
  end if;
  insert into public.student_class_groups (student_id, class_id, family, group_id)
  values (p_student, p_class, p_family, p_group)
  on conflict (student_id, class_id, family) do update set group_id = excluded.group_id;
end $$;

-- Anciennes signatures : groupes de la famille « Demi-groupe », famille déduite du groupe.
create or replace function public.create_class_groups(p_class uuid, p_names text[])
returns integer language sql security definer set search_path = '' as $$
  select public.create_class_groups(p_class, 'Demi-groupe', p_names)
$$;
create or replace function public.set_student_group(p_student uuid, p_class uuid, p_group uuid)
returns void language sql security definer set search_path = '' as $$
  select public.set_student_group(p_student, p_class,
    coalesce((select family from public.class_groups where id = p_group), 'Demi-groupe'), p_group)
$$;


revoke all on function public.create_class_groups(uuid, text, text[]) from public, anon;
revoke all on function public.set_student_group(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.create_class_groups(uuid, text, text[]) to authenticated;
grant execute on function public.set_student_group(uuid, uuid, text, uuid) to authenticated;
