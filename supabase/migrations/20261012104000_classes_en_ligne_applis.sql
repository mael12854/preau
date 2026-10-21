-- « Mes classes en ligne » : liens et codes de chaque classe (Meet, Duolingo, Kahoot…).
create table if not exists public.class_links (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id),
  kind text not null check (kind in ('meet', 'duolingo', 'kahoot', 'autre')),
  label text not null check (char_length(label) between 1 and 80),
  url text check (url is null or url ~ '^https://'),
  code text check (code is null or char_length(code) <= 80),
  removed boolean not null default false,
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
create index if not exists class_links_class_idx on public.class_links (class_id) where not removed;
alter table public.class_links enable row level security;
create policy "liens de classe visibles" on public.class_links for select to authenticated
  using (not removed and (select private.can_see_class(class_id)));

-- Qui peut modifier les liens d'une classe : l'administration de l'école, ou un professeur de la classe.
create or replace function private.can_edit_class_links(p_class uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.teaches_class(p_class)
      or (private.is_admin_staff() and exists (
            select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()))
$$;

create or replace function public.save_class_link(
  p_id uuid, p_class uuid, p_kind text, p_label text, p_url text, p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_url text := nullif(trim(p_url), ''); v_code text := nullif(trim(p_code), '');
begin
  if private.me() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_id is not null then select class_id into p_class from public.class_links where id = p_id and not removed; end if;
  if p_class is null or not private.can_edit_class_links(p_class) then
    raise exception 'Vous ne pouvez pas modifier les liens de cette classe' using errcode = '42501';
  end if;
  if p_kind not in ('meet', 'duolingo', 'kahoot', 'autre') then raise exception 'Type de lien inconnu.'; end if;
  if coalesce(trim(p_label), '') = '' then raise exception 'Donnez un nom au lien.'; end if;
  if v_url is null and v_code is null then raise exception 'Indiquez un lien ou un code.'; end if;
  if v_url is not null and v_url !~ '^https://' then raise exception 'Le lien doit commencer par https://'; end if;
  if p_id is null then
    insert into public.class_links (class_id, kind, label, url, code, created_by)
    values (p_class, p_kind, left(trim(p_label), 80), v_url, left(v_code, 80), private.me())
    returning id into v_id;
  else
    update public.class_links
       set kind = p_kind, label = left(trim(p_label), 80), url = v_url, code = left(v_code, 80), updated_at = now()
     where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.remove_class_link(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_class uuid;
begin
  select class_id into v_class from public.class_links where id = p_id and not removed;
  if v_class is null or not private.can_edit_class_links(v_class) then
    raise exception 'Lien introuvable' using errcode = '42501';
  end if;
  update public.class_links set removed = true, updated_at = now() where id = p_id;
end $$;

revoke execute on function public.save_class_link(uuid, uuid, text, text, text, text) from public, anon;
revoke execute on function public.remove_class_link(uuid) from public, anon;
grant execute on function public.save_class_link(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.remove_class_link(uuid) to authenticated;
revoke all on function private.can_edit_class_links(uuid) from public, anon;

-- « Mes applis » : pour chaque compte, l'identifiant (jamais le mot de passe) de chaque appli, et ses applis ajoutées.
create table if not exists public.my_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  app_key text check (app_key is null or char_length(app_key) <= 40),
  name text check (name is null or char_length(name) between 1 and 60),
  url text check (url is null or url ~ '^https://'),
  login text check (login is null or char_length(login) <= 120),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, app_key),
  check (app_key is not null or (name is not null and url is not null))
);
alter table public.my_apps enable row level security;
create policy "mes applis : lecture" on public.my_apps for select to authenticated using (user_id = (select auth.uid()));
create policy "mes applis : ajout" on public.my_apps for insert to authenticated with check (user_id = (select auth.uid()));
create policy "mes applis : modification" on public.my_apps for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.my_apps from anon;
revoke all on public.class_links from anon;
revoke insert, update on public.class_links from authenticated;
