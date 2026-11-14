-- Rôle au conseil selon le profil : élève → délégué élève, parent → délégué parent, professeur → professeur
-- (professeur principal : seulement celui choisi pour le conseil), direction → direction, vie scolaire et secrétariat → vie scolaire.
create or replace function public.set_council_participant(p_council uuid, p_profile uuid, p_role public.council_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.class_councils; v_acc uuid; v_other text; v_kind text;
begin
  select * into v_c from public.class_councils where id = p_council;
  if v_c.id is null or v_c.school_id <> private.my_school()
     or not (private.my_kind() in ('direction', 'secretariat') or v_c.head_teacher_id = private.me()) then
    raise exception 'Conseil introuvable' using errcode = '42501';
  end if;
  select kind::text into v_kind from public.profiles where id = p_profile and school_id = v_c.school_id;
  if v_kind is null then raise exception 'Personne introuvable dans l''établissement.'; end if;
  if p_role is null then raise exception 'Choisissez un rôle.'; end if;
  if not (
       (v_kind = 'eleve' and p_role = 'delegue_eleve')
    or (v_kind = 'parent' and p_role = 'delegue_parent')
    or (v_kind = 'prof' and (p_role = 'prof' or (p_role = 'prof_principal' and p_profile = v_c.head_teacher_id)))
    or (v_kind = 'direction' and p_role = 'direction')
    or (v_kind in ('cpe', 'secretariat') and p_role = 'vie_scolaire')) then
    raise exception 'Ce rôle ne correspond pas à cette personne.';
  end if;
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
