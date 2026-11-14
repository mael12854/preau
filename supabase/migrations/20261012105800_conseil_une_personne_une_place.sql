-- Conseil de classe : une personne (un compte) n'y participe qu'une fois, même si elle a plusieurs profils
-- (ex. professeure, élève et parent).

create or replace function private.profile_account(p_profile uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select coalesce((select user_id from public.profiles where id = p_profile),
                  (select min(pl.user_id::text)::uuid from public.profile_links pl where pl.profile_id = p_profile))
$$;
revoke all on function private.profile_account(uuid) from public, anon, authenticated;

create or replace function public.set_council_participant(p_council uuid, p_profile uuid, p_role public.council_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.class_councils; v_acc uuid; v_other text;
begin
  select * into v_c from public.class_councils where id = p_council;
  if v_c.id is null or v_c.school_id <> private.my_school()
     or not (private.my_kind() in ('direction', 'secretariat') or v_c.head_teacher_id = private.me()) then
    raise exception 'Conseil introuvable' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile and school_id = v_c.school_id) then
    raise exception 'Personne introuvable dans l''établissement.';
  end if;
  if p_role is null then raise exception 'Choisissez un rôle.'; end if;
  v_acc := private.profile_account(p_profile);
  if v_acc is not null then
    select p.display_name into v_other from public.class_council_participants cp join public.profiles p on p.id = cp.profile_id
     where cp.council_id = p_council and cp.profile_id <> p_profile and private.profile_account(cp.profile_id) = v_acc limit 1;
    if v_other is not null then
      raise exception 'Cette personne participe déjà au conseil (en tant que %).', v_other;
    end if;
  end if;
  insert into public.class_council_participants (council_id, profile_id, role) values (p_council, p_profile, p_role)
  on conflict (council_id, profile_id) do update set role = excluded.role;
end $$;

-- Profils de l'école qu'on ne peut plus ajouter : la même personne participe déjà sous un autre profil.
create or replace function public.council_taken_profiles(p_council uuid) returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(p.id), '{}')
  from public.class_councils c join public.profiles p on p.school_id = c.school_id
  where c.id = p_council and c.school_id = private.my_school()
    and (private.my_kind() in ('direction', 'secretariat') or c.head_teacher_id = private.me())
    and exists (select 1 from public.class_council_participants cp
                where cp.council_id = c.id and cp.profile_id <> p.id
                  and private.profile_account(cp.profile_id) = private.profile_account(p.id))
$$;
revoke all on function public.council_taken_profiles(uuid) from public, anon;
grant execute on function public.council_taken_profiles(uuid) to authenticated;
