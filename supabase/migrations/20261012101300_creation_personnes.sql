-- Annuaire : créer des personnes (élèves, responsables, personnel) et affecter les enseignants.
-- Réservé au secrétariat et à la direction de l'établissement ; seule la direction crée la direction.
-- Le compte de connexion (e-mail + mot de passe provisoire) est créé ensuite par le serveur,
-- après vérification par public.manageable_person.

create or replace function public.create_person(
  p_kind public.person_kind, p_first_name text, p_last_name text, p_civility public.civility,
  p_class uuid, p_children uuid[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
  v_school uuid := private.my_school();
  v_first text := nullif(trim(p_first_name), '');
  v_last text := nullif(trim(p_last_name), '');
begin
  if private.me() is null or private.my_kind() not in ('secretariat', 'direction') then
    raise exception 'Seuls le secrétariat et la direction ajoutent des personnes.' using errcode = '42501';
  end if;
  if p_kind = 'direction' and private.my_kind() <> 'direction' then
    raise exception 'Seule la direction ajoute un membre de la direction.' using errcode = '42501';
  end if;
  if v_last is null then raise exception 'Indiquez au moins le nom de famille.'; end if;
  if length(coalesce(v_first, '')) > 80 or length(v_last) > 80 then raise exception 'Le prénom et le nom font 80 caractères au plus.'; end if;
  if p_kind = 'eleve' and not exists (select 1 from public.classes c where c.id = p_class and c.school_id = v_school) then
    raise exception 'Choisissez la classe de l''élève.';
  end if;
  if p_kind = 'parent' and exists (
    select 1 from unnest(coalesce(p_children, '{}')) k(id)
    where not exists (select 1 from public.students s join public.profiles p on p.id = s.profile_id where s.profile_id = k.id and p.school_id = v_school)
  ) then
    raise exception 'Enfant introuvable' using errcode = '42501';
  end if;

  insert into public.profiles (id, school_id, kind, first_name, last_name, civility, display_name, initials, role_label, title)
  values (
    v_id, v_school, p_kind, v_first, v_last, p_civility,
    case when p_kind in ('eleve', 'parent') or p_civility is null then concat_ws(' ', v_first, v_last)
         when p_civility = 'madame' then 'Mme ' || v_last else 'M. ' || v_last end,
    upper(left(coalesce(v_first, v_last), 1) || left(v_last, 1)),
    case p_kind when 'cpe' then 'Vie scolaire' when 'secretariat' then 'Secrétariat' when 'direction' then 'Direction' else null end,
    case p_kind when 'cpe' then 'Vie scolaire' when 'secretariat' then 'Secrétariat' when 'direction' then 'Direction'
                when 'parent' then 'Responsable légal' else null end
  );
  insert into public.profile_private (profile_id) values (v_id);
  if p_kind = 'eleve' then
    insert into public.students (profile_id, class_id) values (v_id, p_class);
  elsif p_kind = 'parent' then
    insert into public.guardians (guardian_id, student_id) select v_id, k from unnest(coalesce(p_children, '{}')) k on conflict do nothing;
  end if;
  return v_id;
end $$;

-- Rattacher un responsable à un élève (secrétariat, direction).
create or replace function public.link_guardian(p_guardian uuid, p_student uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.manageable_person(p_guardian);
  perform public.manageable_person(p_student);
  if (select kind from public.profiles where id = p_guardian) <> 'parent'
     or not exists (select 1 from public.students where profile_id = p_student) then
    raise exception 'Rattachement impossible.';
  end if;
  insert into public.guardians (guardian_id, student_id) values (p_guardian, p_student) on conflict do nothing;
end $$;

-- Affecter un enseignant : en primaire, il devient titulaire de la classe (toutes les matières) ;
-- au collège et au lycée, il prend la matière dans la classe.
create or replace function public.assign_teaching(p_teacher uuid, p_class uuid, p_subject text, p_head boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.classes;
begin
  perform public.manageable_person(p_teacher);
  if (select kind from public.profiles where id = p_teacher) is distinct from 'prof' then
    raise exception 'Seul un enseignant peut être affecté à une classe.';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if v_c.level = 'primaire' then
    update public.classes set teacher_id = p_teacher where id = p_class;
  else
    if not exists (select 1 from public.subjects where id = p_subject) then raise exception 'Choisissez une matière.'; end if;
    insert into public.teachings (class_id, subject_id, teacher_id, is_head_teacher)
    values (p_class, p_subject, p_teacher, coalesce(p_head, false))
    on conflict (class_id, subject_id) do update set teacher_id = excluded.teacher_id, is_head_teacher = excluded.is_head_teacher;
  end if;
end $$;

revoke all on function public.create_person(public.person_kind, text, text, public.civility, uuid, uuid[]) from public, anon;
revoke all on function public.link_guardian(uuid, uuid) from public, anon;
revoke all on function public.assign_teaching(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.create_person(public.person_kind, text, text, public.civility, uuid, uuid[]) to authenticated;
grant execute on function public.link_guardian(uuid, uuid) to authenticated;
grant execute on function public.assign_teaching(uuid, uuid, text, boolean) to authenticated;
