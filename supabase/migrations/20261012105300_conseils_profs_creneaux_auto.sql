-- 1. Un professeur peut créer le conseil d'une classe où il enseigne (il en devient le professeur principal par défaut).
-- 2. Réunions parents-profs : à la création, chaque professeur des classes concernées reçoit ses créneaux sur toute la plage.

-- Préparation des bulletins d'une classe, sans contrôle de rôle (appelée par des fonctions qui l'ont déjà fait).
create or replace function private.prepare_report_cards(p_class uuid, p_term smallint, p_publish_on date)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_year text; v_count integer;
begin
  select regexp_replace(s.year_label, '^\D*', '') into v_year
    from public.classes c join public.schools s on s.id = c.school_id where c.id = p_class;
  insert into public.report_cards (student_id, school_year, term, class_name, head_teacher, publish_on)
  select s.profile_id, v_year, p_term, mc.name, (
           select p.display_name from public.profiles p
           where p.id = coalesce(mc.teacher_id, (select t.teacher_id from public.teachings t where t.class_id = mc.id and t.is_head_teacher limit 1))),
         p_publish_on
  from public.students s join public.classes mc on mc.id = s.class_id
  where private.in_class(s.profile_id, p_class)
  on conflict (student_id, school_year, term) do update set publish_on = excluded.publish_on;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function private.prepare_report_cards(uuid, smallint, date) from public, anon, authenticated;

create or replace function public.create_class_council(
  p_class uuid, p_term smallint, p_held_at timestamptz, p_period_start date, p_period_end date, p_head_teacher uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_c public.classes; v_year text; v_id uuid; v_head uuid := p_head_teacher; v_prof boolean := private.my_kind() = 'prof';
begin
  if private.me() is null or not (private.my_kind() in ('direction', 'secretariat') or (v_prof and private.teaches_class(p_class))) then
    raise exception 'Seuls la direction, le secrétariat et les professeurs de la classe créent les conseils de classe.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  if p_held_at is null then raise exception 'Indiquez la date du conseil.'; end if;
  if p_period_start is null or p_period_end is null or p_period_end < p_period_start then raise exception 'Période invalide.'; end if;
  if v_prof and v_head is null then v_head := private.me(); end if;
  if v_head is not null and not exists (
       select 1 from public.profiles where id = v_head and kind = 'prof' and school_id = v_c.school_id) then
    raise exception 'Choisissez un professeur de l''établissement comme professeur principal.';
  end if;
  select regexp_replace(year_label, '^\D*', '') into v_year from public.schools where id = v_c.school_id;
  if exists (select 1 from public.class_councils where class_id = p_class and school_year = v_year and term = p_term) then
    raise exception 'Un conseil existe déjà pour cette classe et ce trimestre.';
  end if;
  insert into public.class_councils (school_id, class_id, school_year, term, period_start, period_end, held_at, head_teacher_id, created_by)
  values (v_c.school_id, p_class, v_year, p_term, p_period_start, p_period_end, p_held_at, v_head, private.me())
  returning id into v_id;
  perform private.prepare_report_cards(p_class, p_term, p_held_at::date);
  update public.report_cards rc set council_id = v_id
   where rc.school_year = v_year and rc.term = p_term and private.in_class(rc.student_id, p_class);
  insert into public.class_council_participants (council_id, profile_id, role)
  select distinct v_id, t.teacher_id, 'prof'::public.council_role from public.teachings t where t.class_id = p_class
  on conflict do nothing;
  if v_head is not null then
    insert into public.class_council_participants (council_id, profile_id, role) values (v_id, v_head, 'prof_principal')
    on conflict (council_id, profile_id) do update set role = 'prof_principal';
  end if;
  insert into public.class_council_participants (council_id, profile_id, role)
  values (v_id, private.me(), case private.my_kind() when 'direction' then 'direction' when 'prof' then 'prof' else 'vie_scolaire' end::public.council_role)
  on conflict do nothing;
  return v_id;
end $$;

-- Participants : administration, ou professeur principal du conseil.
create or replace function public.set_council_participant(p_council uuid, p_profile uuid, p_role public.council_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.class_councils;
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
  insert into public.class_council_participants (council_id, profile_id, role) values (p_council, p_profile, p_role)
  on conflict (council_id, profile_id) do update set role = excluded.role;
end $$;

-- Créneaux d'un professeur sur toute la plage de la réunion (ceux qui chevaucheraient un autre de ses créneaux sont sautés).
create or replace function private.generate_meeting_slots(p_meeting uuid, p_teacher uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare m public.parent_meetings; t time; v_n integer := 0;
begin
  select * into m from public.parent_meetings where id = p_meeting;
  t := m.starts;
  while t + make_interval(mins => m.slot_minutes) <= m.ends loop
    begin
      insert into public.meeting_slots (meeting_id, teacher_id, starts_at, ends_at)
      values (p_meeting, p_teacher, (m.day + t) at time zone 'Europe/Paris',
              (m.day + t + make_interval(mins => m.slot_minutes)) at time zone 'Europe/Paris');
      v_n := v_n + 1;
    exception when exclusion_violation then null;
    end;
    t := t + make_interval(mins => m.slot_minutes);
  end loop;
  return v_n;
end $$;
revoke all on function private.generate_meeting_slots(uuid, uuid) from public, anon, authenticated;

create or replace function public.create_parent_meeting(
  p_title text, p_day date, p_starts time, p_ends time, p_slot_minutes smallint, p_cancel_hours smallint, p_classes uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_teacher uuid;
begin
  if private.me() is null or private.my_kind() not in ('prof', 'cpe', 'direction', 'secretariat') then
    raise exception 'Réservé au personnel' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à la réunion.'; end if;
  if p_day is null or p_starts is null or p_ends is null or p_ends <= p_starts then raise exception 'Indiquez le jour et la plage horaire.'; end if;
  if p_day < current_date then raise exception 'La réunion ne peut pas être dans le passé.'; end if;
  if coalesce(cardinality(p_classes), 0) = 0 then raise exception 'Choisissez au moins une classe.'; end if;
  if exists (select 1 from unnest(p_classes) c(id) left join public.classes k on k.id = c.id
             where k.id is null or k.school_id <> private.my_school()
                or (not private.is_admin_staff() and not private.teaches_class(c.id))) then
    raise exception 'Classe introuvable, ou que vous n''enseignez pas.' using errcode = '42501';
  end if;
  insert into public.parent_meetings (school_id, title, day, starts, ends, slot_minutes, cancel_hours, created_by)
  values (private.my_school(), left(trim(p_title), 120), p_day, p_starts, p_ends,
          coalesce(p_slot_minutes, 10), coalesce(p_cancel_hours, 24), private.me())
  returning id into v_id;
  insert into public.parent_meeting_classes (meeting_id, class_id) select distinct v_id, c from unnest(p_classes) c;
  -- Tous les professeurs des classes concernées, sur toute la plage.
  for v_teacher in
    select distinct x.t from (
      select t.teacher_id as t from public.teachings t where t.class_id = any (p_classes)
      union select c.teacher_id from public.classes c where c.id = any (p_classes) and c.teacher_id is not null
      union select l.teacher_id from public.lessons l where l.class_id = any (p_classes) and l.starts_at >= now() - interval '120 days') x
    join public.profiles p on p.id = x.t and p.kind = 'prof'
  loop
    perform private.generate_meeting_slots(v_id, v_teacher);
  end loop;
  return v_id;
end $$;
