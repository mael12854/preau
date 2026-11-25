-- Plusieurs bulletins dans un même trimestre (bulletin de mi-trimestre, bulletin n° 2…) : numéro et titre facultatif.
-- Partie 1 (sans retrait de contrainte) : le n° 1 reste le bulletin habituel ; tout fonctionne comme avant.
alter table public.report_cards add column if not exists seq smallint not null default 1 check (seq between 1 and 6);
alter table public.report_cards add column if not exists label text check (label is null or char_length(label) <= 80);
create unique index if not exists report_cards_student_term_seq on public.report_cards (student_id, school_year, term, seq);

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
  on conflict (student_id, school_year, term, seq) do update set publish_on = excluded.publish_on;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

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
  insert into public.report_cards (student_id, school_year, term, class_name, head_teacher, publish_on)
  select s.profile_id, v_year, p_term, mc.name, (
           select p.display_name from public.profiles p
           where p.id = coalesce(mc.teacher_id, (select t.teacher_id from public.teachings t where t.class_id = mc.id and t.is_head_teacher limit 1))),
         p_publish_on
  from public.students s join public.classes mc on mc.id = s.class_id
  where private.in_class(s.profile_id, p_class)
  on conflict (student_id, school_year, term, seq) do update set publish_on = excluded.publish_on;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Préparer un bulletin donné d'un trimestre (n° et titre) pour toute une classe.
create or replace function public.prepare_report_card_set(p_class uuid, p_term smallint, p_seq smallint, p_label text, p_publish_on date)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_c public.classes; v_year text; v_count integer; v_label text := nullif(left(trim(coalesce(p_label, '')), 80), '');
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat préparent les bulletins.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  if coalesce(p_seq, 1) not between 1 and 6 then raise exception '6 bulletins au plus par trimestre.'; end if;
  if p_publish_on is null then raise exception 'Indiquez une date de publication.'; end if;
  select regexp_replace(year_label, '^\D*', '') into v_year from public.schools where id = v_c.school_id;
  insert into public.report_cards (student_id, school_year, term, seq, label, class_name, head_teacher, publish_on)
  select s.profile_id, v_year, p_term, coalesce(p_seq, 1), v_label, mc.name, (
           select p.display_name from public.profiles p
           where p.id = coalesce(mc.teacher_id, (select t.teacher_id from public.teachings t where t.class_id = mc.id and t.is_head_teacher limit 1))),
         p_publish_on
  from public.students s join public.classes mc on mc.id = s.class_id
  where private.in_class(s.profile_id, p_class)
  on conflict (student_id, school_year, term, seq) do update set publish_on = excluded.publish_on, label = coalesce(excluded.label, public.report_cards.label);
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.prepare_report_card_set(uuid, smallint, smallint, text, date) from public, anon;
grant execute on function public.prepare_report_card_set(uuid, smallint, smallint, text, date) to authenticated;

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
   where rc.school_year = v_year and rc.term = p_term and rc.seq = 1 and private.in_class(rc.student_id, p_class);
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
