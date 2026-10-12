-- Agenda, annuaire et bulletins : les écritures qui manquaient.
-- Toutes passent par des fonctions qui vérifient les droits et refusent un compte sans profil.

-- ── Agenda ────────────────────────────────────────────────────────
alter table public.agenda_events add column created_by uuid references public.profiles (id) on delete set null;

-- Ajouter un événement : administration (établissement ou classe), professeur (ses classes).
create or replace function public.add_agenda_event(
  p_title text, p_starts_on date, p_ends_on date, p_class uuid, p_tone public.tone, p_is_holiday boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_kind public.person_kind := private.my_kind();
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  if coalesce(trim(p_title), '') = '' or length(p_title) > 120 then raise exception 'Indiquez un titre (120 caractères au plus).'; end if;
  if p_starts_on is null then raise exception 'Indiquez une date.'; end if;
  if p_ends_on is not null and p_ends_on < p_starts_on then raise exception 'La date de fin précède la date de début.'; end if;
  if p_class is not null and not exists (select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()) then
    raise exception 'Classe introuvable' using errcode = '42501';
  end if;
  if v_kind in ('cpe', 'direction', 'secretariat') then
    null;
  elsif v_kind = 'prof' then
    if p_class is null or not private.teaches_class(p_class) or coalesce(p_is_holiday, false) then
      raise exception 'Un professeur ajoute des événements pour ses classes.' using errcode = '42501';
    end if;
  else
    raise exception 'Seul le personnel peut ajouter des événements.' using errcode = '42501';
  end if;
  insert into public.agenda_events (school_id, class_id, title, tone, starts_on, ends_on, is_holiday, created_by)
  values (private.my_school(), p_class, trim(p_title), coalesce(p_tone, 'neutral'), p_starts_on,
          nullif(p_ends_on, p_starts_on), coalesce(p_is_holiday, false), private.me())
  returning id into v_id;
  return v_id;
end $$;

-- Retirer un événement : son auteur, ou la direction et le secrétariat.
create or replace function public.delete_agenda_event(p_event uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.agenda_events;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_e from public.agenda_events where id = p_event;
  if v_e.id is null or v_e.school_id is distinct from private.my_school()
     or not coalesce(v_e.created_by = private.me() or private.my_kind() in ('direction', 'secretariat'), false) then
    raise exception 'Événement introuvable' using errcode = '42501';
  end if;
  delete from public.agenda_events where id = p_event;
end $$;

-- ── Annuaire : noms et adresses, par le secrétariat et la direction ──
-- Vérifie que la personne appartient à l'établissement de l'appelant (secrétariat ou direction)
-- et renvoie son compte de connexion (nul si elle n'en a pas).
create or replace function public.manageable_person(p_profile uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_p public.profiles;
begin
  if private.me() is null or private.my_kind() not in ('secretariat', 'direction') then
    raise exception 'Seuls le secrétariat et la direction gèrent l''annuaire.' using errcode = '42501';
  end if;
  select * into v_p from public.profiles where id = p_profile;
  if v_p.id is null or v_p.school_id is distinct from private.my_school() then
    raise exception 'Personne introuvable' using errcode = '42501';
  end if;
  -- Le secrétariat ne modifie pas la direction (changer son adresse de connexion permettrait de prendre son compte).
  if v_p.kind = 'direction' and private.my_kind() <> 'direction' then
    raise exception 'Seule la direction modifie les comptes de la direction.' using errcode = '42501';
  end if;
  return v_p.user_id;
end $$;

create or replace function public.update_person_name(
  p_profile uuid, p_first_name text, p_last_name text, p_civility public.civility
) returns void language plpgsql security definer set search_path = '' as $$
declare v_kind public.person_kind; v_first text := nullif(trim(p_first_name), ''); v_last text := nullif(trim(p_last_name), '');
begin
  perform public.manageable_person(p_profile);
  if v_last is null then raise exception 'Indiquez au moins le nom de famille.'; end if;
  if length(coalesce(v_first, '')) > 80 or length(v_last) > 80 then raise exception 'Le prénom et le nom font 80 caractères au plus.'; end if;
  select kind into v_kind from public.profiles where id = p_profile;
  update public.profiles
     set first_name = v_first, last_name = v_last, civility = p_civility,
         -- Élèves et familles : « Prénom Nom » ; personnel : « Mme Nom », « M. Nom » si la civilité est connue.
         display_name = case
           when v_kind in ('eleve', 'parent') or p_civility is null then concat_ws(' ', v_first, v_last)
           when p_civility = 'madame' then 'Mme ' || v_last else 'M. ' || v_last end,
         initials = upper(left(coalesce(v_first, v_last), 1) || left(v_last, 1))
   where id = p_profile;
end $$;

-- Adresse de contact affichée dans l'annuaire (l'adresse de connexion est changée par le serveur).
create or replace function public.update_person_email(p_profile uuid, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.manageable_person(p_profile);
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide.'; end if;
  insert into public.profile_private (profile_id, email) values (p_profile, lower(trim(p_email)))
  on conflict (profile_id) do update set email = excluded.email;
end $$;

-- ── Bulletins ─────────────────────────────────────────────────────
alter table public.report_card_lines add column updated_by uuid references public.profiles (id) on delete set null;

-- Le professeur de la matière dans la classe de l'élève (ou le titulaire, en primaire).
create or replace function private.teaches_subject_to(p_student uuid, p_subject text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students s
    join public.teachings t on t.class_id = s.class_id and t.subject_id = p_subject and t.teacher_id = private.me()
    where s.profile_id = p_student)
  or exists (
    select 1 from public.students s join public.classes c on c.id = s.class_id
    where s.profile_id = p_student and c.teacher_id = private.me())
$$;

-- Les professeurs voient les bulletins (et leurs lignes) des élèves de leurs classes, pour les remplir.
create policy "bulletins : professeurs de la classe" on public.report_cards for select to authenticated
  using ((select private.my_kind()) = 'prof' and (select private.teaches_class(private.class_of(student_id))));
create policy "lignes de bulletin : professeurs de la classe" on public.report_card_lines for select to authenticated
  using ((select private.my_kind()) = 'prof' and exists (
    select 1 from public.report_cards rc where rc.id = report_card_id and (select private.teaches_class(private.class_of(rc.student_id)))));

-- Préparer les bulletins d'une classe pour un trimestre (direction, secrétariat) : un par élève.
create or replace function public.create_report_cards(p_class uuid, p_term smallint, p_publish_on date)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_c public.classes; v_year text; v_head text; v_count integer;
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat préparent les bulletins.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  if p_publish_on is null then raise exception 'Indiquez une date de publication.'; end if;
  select regexp_replace(year_label, '^\D*', '') into v_year from public.schools where id = v_c.school_id;
  select p.display_name into v_head from public.profiles p
   where p.id = coalesce(v_c.teacher_id, (select t.teacher_id from public.teachings t where t.class_id = p_class and t.is_head_teacher limit 1));
  insert into public.report_cards (student_id, school_year, term, class_name, head_teacher, publish_on)
  select s.profile_id, v_year, p_term, v_c.name, v_head, p_publish_on from public.students s where s.class_id = p_class
  on conflict (student_id, school_year, term) do update set publish_on = excluded.publish_on;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Ligne d'un bulletin (matière) : le professeur de la matière, ou la direction.
-- p_level nul : pas de positionnement (établissements notés sur 20) ; l'appréciation reste obligatoire.
create or replace function public.set_report_line(p_report_card uuid, p_subject text, p_level public.eval_value, p_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rc public.report_cards;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_rc from public.report_cards where id = p_report_card;
  if v_rc.id is null or not coalesce(
       (private.my_kind() = 'direction' and private.can_see_student(v_rc.student_id))
       or (private.my_kind() = 'prof' and private.teaches_subject_to(v_rc.student_id, p_subject)), false) then
    raise exception 'Bulletin introuvable' using errcode = '42501';
  end if;
  if p_level is not null and p_level not in ('MI', 'MF', 'MS', 'TB') then raise exception 'Positionnement invalide.'; end if;
  if coalesce(trim(p_comment), '') = '' then
    delete from public.report_card_lines where report_card_id = p_report_card and subject_id = p_subject;
    return;
  end if;
  insert into public.report_card_lines (report_card_id, subject_id, level, comment, position, updated_by)
  values (p_report_card, p_subject, coalesce(p_level, 'NE'), trim(p_comment),
          coalesce((select max(position) + 1 from public.report_card_lines where report_card_id = p_report_card), 0), private.me())
  on conflict (report_card_id, subject_id) do update
    set level = excluded.level, comment = excluded.comment, updated_by = excluded.updated_by;
end $$;

-- Avis du conseil de classe : la direction.
create or replace function public.set_report_council(p_report_card uuid, p_mention text, p_text text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rc public.report_cards;
begin
  if private.me() is null or private.my_kind() <> 'direction' then
    raise exception 'Seule la direction rédige l''avis du conseil de classe.' using errcode = '42501';
  end if;
  select * into v_rc from public.report_cards where id = p_report_card;
  if v_rc.id is null or not coalesce(private.can_see_student(v_rc.student_id), false) then
    raise exception 'Bulletin introuvable' using errcode = '42501';
  end if;
  update public.report_cards
     set council_mention = nullif(trim(coalesce(p_mention, '')), ''), council_text = nullif(trim(coalesce(p_text, '')), '')
   where id = p_report_card;
end $$;

-- ── Droits d'exécution ────────────────────────────────────────────
revoke all on function public.add_agenda_event(text, date, date, uuid, public.tone, boolean) from public, anon;
revoke all on function public.delete_agenda_event(uuid) from public, anon;
revoke all on function public.manageable_person(uuid) from public, anon;
revoke all on function public.update_person_name(uuid, text, text, public.civility) from public, anon;
revoke all on function public.update_person_email(uuid, text) from public, anon;
revoke all on function public.create_report_cards(uuid, smallint, date) from public, anon;
revoke all on function public.set_report_line(uuid, text, public.eval_value, text) from public, anon;
revoke all on function public.set_report_council(uuid, text, text) from public, anon;
revoke all on function private.teaches_subject_to(uuid, text) from public, anon;
grant execute on function public.add_agenda_event(text, date, date, uuid, public.tone, boolean) to authenticated;
grant execute on function public.delete_agenda_event(uuid) to authenticated;
grant execute on function public.manageable_person(uuid) to authenticated;
grant execute on function public.update_person_name(uuid, text, text, public.civility) to authenticated;
grant execute on function public.update_person_email(uuid, text) to authenticated;
grant execute on function public.create_report_cards(uuid, smallint, date) to authenticated;
grant execute on function public.set_report_line(uuid, text, public.eval_value, text) to authenticated;
grant execute on function public.set_report_council(uuid, text, text) to authenticated;
grant execute on function private.teaches_subject_to(uuid, text) to authenticated;
