-- Comptes à plusieurs rôles : une même connexion peut ouvrir plusieurs fiches
-- (par exemple élève à +VK et parent d'un enfant à l'École du Weekend).
-- profiles.user_id reste la fiche principale ; profile_links rattache les fiches supplémentaires.
-- L'application indique la fiche active dans l'en-tête « x-preau-profile » ; la base vérifie à chaque
-- requête qu'elle appartient bien au compte connecté, sinon elle retombe sur la fiche principale.

create table public.profile_links (
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);
alter table public.profile_links enable row level security;
revoke all on public.profile_links from anon;
revoke insert, update, delete, truncate on public.profile_links from authenticated;
grant select on public.profile_links to authenticated;
create policy "mes fiches rattachées" on public.profile_links for select to authenticated
  using (user_id = (select auth.uid()));

-- Fiche active : celle demandée par l'en-tête si elle appartient au compte, sinon la fiche principale.
create or replace function private.me() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_req text; v_id uuid;
begin
  if v_uid is null then return null; end if;
  begin
    v_req := current_setting('request.headers', true)::json ->> 'x-preau-profile';
  exception when others then v_req := null;
  end;
  if v_req ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select p.id into v_id from public.profiles p
     where p.id = v_req::uuid
       and (p.user_id = v_uid or exists (select 1 from public.profile_links l where l.profile_id = p.id and l.user_id = v_uid));
    if v_id is not null then return v_id; end if;
  end if;
  select id into v_id from public.profiles where user_id = v_uid;
  if v_id is null then
    select profile_id into v_id from public.profile_links where user_id = v_uid order by added_at limit 1;
  end if;
  return v_id;
end $$;

create or replace function private.my_kind() returns public.person_kind
language sql stable security definer set search_path = '' as $$
  select kind from public.profiles where id = private.me()
$$;

create or replace function private.my_school() returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where id = private.me()
$$;

-- Les fiches que le compte connecté peut ouvrir (pour le menu « Changer d'espace »).
create or replace function public.my_profiles()
returns table (id uuid, kind public.person_kind, display_name text, school text, detail text, is_primary boolean)
language sql stable security definer set search_path = '' as $$
  select p.id, p.kind, p.display_name, s.name,
         case p.kind
           when 'eleve' then (select c.name from public.students st join public.classes c on c.id = st.class_id where st.profile_id = p.id)
           when 'parent' then (select 'Responsable de ' || string_agg(sp.first_name, ', ') from public.guardians g join public.profiles sp on sp.id = g.student_id where g.guardian_id = p.id)
           else p.role_label end,
         p.user_id = auth.uid()
  from public.profiles p join public.schools s on s.id = p.school_id
  where auth.uid() is not null
    and (p.user_id = auth.uid() or exists (select 1 from public.profile_links l where l.profile_id = p.id and l.user_id = auth.uid()))
  order by p.user_id = auth.uid() desc, s.name, p.kind
$$;
revoke all on function public.my_profiles() from public, anon;
grant execute on function public.my_profiles() to authenticated;

-- Annuaire : rattacher une fiche de l'établissement à un compte existant (adresse déjà utilisée ailleurs).
-- Le serveur trouve le compte par son adresse puis appelle cette fonction ; elle vérifie les droits.
create or replace function public.link_profile_account(p_profile uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.manageable_person(p_profile);
  if exists (select 1 from public.profiles where id = p_profile and user_id is not null) then
    raise exception 'Cette personne a déjà un compte.';
  end if;
  insert into public.profile_links (user_id, profile_id) values (p_user, p_profile) on conflict do nothing;
end $$;
revoke all on function public.link_profile_account(uuid, uuid) from public, anon;
grant execute on function public.link_profile_account(uuid, uuid) to authenticated;
