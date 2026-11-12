-- Conseils de classe : une classe, un trimestre, une date, des participants ; préparation → en cours → clôturé.
-- Les bulletins (report_cards) sont rattachés au conseil et ne sont visibles des familles qu'après la clôture.

create type public.council_status as enum ('preparation', 'en_cours', 'cloture');
create type public.council_role as enum ('prof', 'prof_principal', 'direction', 'vie_scolaire', 'delegue_eleve', 'delegue_parent');

create table public.class_councils (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id),
  class_id uuid not null references public.classes (id),
  school_year text not null,
  term smallint not null check (term between 1 and 3),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  held_at timestamptz not null,
  head_teacher_id uuid references public.profiles (id),
  status public.council_status not null default 'preparation',
  created_by uuid references public.profiles (id),
  closed_at timestamptz,
  unique (class_id, school_year, term)
);
create index on public.class_councils (school_id, held_at);

create table public.class_council_participants (
  council_id uuid not null references public.class_councils (id),
  profile_id uuid not null references public.profiles (id),
  role public.council_role not null,
  primary key (council_id, profile_id)
);

alter table public.report_cards add column if not exists council_id uuid references public.class_councils (id);
alter table public.report_cards add column if not exists published_at timestamptz;
alter table public.report_cards add constraint report_cards_mention_check check (council_mention is null or council_mention in (
  'Félicitations', 'Compliments', 'Encouragements',
  'Avertissement travail', 'Avertissement assiduité', 'Avertissement comportement')) not valid;

-- ── Publication ───────────────────────────────────────────────────
-- Bulletin d'un conseil : publié à la clôture. Ancien bulletin sans conseil : à sa date de publication.
create or replace function private.report_published(p_card uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.report_cards rc left join public.class_councils cc on cc.id = rc.council_id
    where rc.id = p_card
      and case when rc.council_id is null then rc.publish_on <= current_date else cc.status = 'cloture' end)
$$;

-- Faille corrigée : avant, l'en-tête du bulletin (mention, avis du conseil) était lisible par la famille avant publication.
alter policy "bulletins" on public.report_cards using (
  ((select private.is_family_of(student_id)) and (select private.report_published(id)))
  or ((select private.my_kind()) in ('direction', 'cpe', 'secretariat') and (select private.can_see_student(student_id))));
alter policy "lignes de bulletin publiées" on public.report_card_lines using (exists (
  select 1 from public.report_cards rc where rc.id = report_card_id and (
       ((select private.is_family_of(rc.student_id)) and (select private.report_published(rc.id)))
    or ((select private.my_kind()) in ('direction', 'cpe', 'secretariat') and (select private.can_see_student(rc.student_id))))));

-- ── Lecture des conseils ──────────────────────────────────────────
create or replace function private.council_staff(p_council uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_councils c where c.id = p_council and (
    (private.is_admin_staff() and c.school_id = private.my_school()) or private.teaches_class(c.class_id)))
$$;

alter table public.class_councils enable row level security;
alter table public.class_council_participants enable row level security;
create policy "conseils : personnel de la classe et participants" on public.class_councils for select to authenticated using (
  (select private.council_staff(id))
  or exists (select 1 from public.class_council_participants p where p.council_id = id and p.profile_id = (select private.me())));
create policy "participants : comme le conseil" on public.class_council_participants for select to authenticated using (
  (select private.council_staff(council_id)) or profile_id = (select private.me()));
revoke all on public.class_councils, public.class_council_participants from anon;
revoke insert, update on public.class_councils, public.class_council_participants from authenticated;

-- ── Moyennes (évaluations notées sur 20, publiées, de la période) ─
create or replace function private.subject_average(p_student uuid, p_subject text, p_from date, p_to date)
returns numeric language sql stable security definer set search_path = '' as $$
  select round(avg(r.score), 2) from public.assessment_results r join public.assessments a on a.id = r.assessment_id
  where r.student_id = p_student and a.subject_id = p_subject and a.published_at is not null
    and a.held_on between p_from and p_to and r.score is not null
$$;

-- ── Création et étapes ────────────────────────────────────────────
create or replace function public.create_class_council(
  p_class uuid, p_term smallint, p_held_at timestamptz, p_period_start date, p_period_end date, p_head_teacher uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_c public.classes; v_year text; v_id uuid;
begin
  if private.me() is null or private.my_kind() not in ('direction', 'secretariat') then
    raise exception 'Seuls la direction et le secrétariat créent les conseils de classe.' using errcode = '42501';
  end if;
  select * into v_c from public.classes where id = p_class;
  if v_c.id is null or v_c.school_id is distinct from private.my_school() then raise exception 'Classe introuvable' using errcode = '42501'; end if;
  if p_term not between 1 and 3 then raise exception 'Trimestre invalide.'; end if;
  if p_held_at is null then raise exception 'Indiquez la date du conseil.'; end if;
  if p_period_start is null or p_period_end is null or p_period_end < p_period_start then raise exception 'Période invalide.'; end if;
  if p_head_teacher is not null and not exists (
       select 1 from public.profiles where id = p_head_teacher and kind = 'prof' and school_id = v_c.school_id) then
    raise exception 'Choisissez un professeur de l''établissement comme professeur principal.';
  end if;
  select regexp_replace(year_label, '^\D*', '') into v_year from public.schools where id = v_c.school_id;
  if exists (select 1 from public.class_councils where class_id = p_class and school_year = v_year and term = p_term) then
    raise exception 'Un conseil existe déjà pour cette classe et ce trimestre.';
  end if;
  insert into public.class_councils (school_id, class_id, school_year, term, period_start, period_end, held_at, head_teacher_id, created_by)
  values (v_c.school_id, p_class, v_year, p_term, p_period_start, p_period_end, p_held_at, p_head_teacher, private.me())
  returning id into v_id;
  -- Bulletins de la classe, rattachés au conseil (non publiés tant que le conseil n'est pas clôturé).
  perform public.create_report_cards(p_class, p_term, p_held_at::date);
  update public.report_cards rc set council_id = v_id
   where rc.school_year = v_year and rc.term = p_term and private.in_class(rc.student_id, p_class);
  -- Participants : les professeurs de la classe, le professeur principal, la personne qui crée le conseil.
  insert into public.class_council_participants (council_id, profile_id, role)
  select distinct v_id, t.teacher_id, 'prof'::public.council_role from public.teachings t where t.class_id = p_class
  on conflict do nothing;
  if p_head_teacher is not null then
    insert into public.class_council_participants (council_id, profile_id, role) values (v_id, p_head_teacher, 'prof_principal')
    on conflict (council_id, profile_id) do update set role = 'prof_principal';
  end if;
  insert into public.class_council_participants (council_id, profile_id, role)
  values (v_id, private.me(), case when private.my_kind() = 'direction' then 'direction' else 'vie_scolaire' end::public.council_role)
  on conflict do nothing;
  return v_id;
end $$;

create or replace function public.set_council_participant(p_council uuid, p_profile uuid, p_role public.council_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.class_councils;
begin
  select * into v_c from public.class_councils where id = p_council;
  if v_c.id is null or private.my_kind() not in ('direction', 'secretariat') or v_c.school_id <> private.my_school() then
    raise exception 'Conseil introuvable' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile and school_id = v_c.school_id) then
    raise exception 'Personne introuvable dans l''établissement.';
  end if;
  if p_role is null then raise exception 'Choisissez un rôle.'; end if;
  insert into public.class_council_participants (council_id, profile_id, role) values (p_council, p_profile, p_role)
  on conflict (council_id, profile_id) do update set role = excluded.role;
end $$;

-- Étapes : préparation → en cours → clôturé (jamais en arrière). La clôture publie les bulletins,
-- après avoir reporté sur chaque ligne la moyenne de la période quand le professeur n'a pas saisi de note.
create or replace function public.set_council_status(p_council uuid, p_status public.council_status)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.class_councils; v_grading text;
begin
  select * into v_c from public.class_councils where id = p_council;
  if v_c.id is null or not (
       (private.my_kind() in ('direction', 'secretariat') and v_c.school_id = private.my_school())
       or v_c.head_teacher_id = private.me()) then
    raise exception 'Conseil introuvable' using errcode = '42501';
  end if;
  if (v_c.status, p_status) not in (('preparation', 'en_cours'), ('en_cours', 'cloture')) then
    raise exception 'Étape impossible : un conseil passe de la préparation au conseil, puis à la clôture.';
  end if;
  if p_status = 'cloture' then
    select grading::text into v_grading from public.schools where id = v_c.school_id;
    if v_grading = 'note20' then
      -- Moyenne des évaluations, arrondie au demi-point (comme les notes du bulletin).
      update public.report_card_lines l set score = round(private.subject_average(rc.student_id, l.subject_id, v_c.period_start, v_c.period_end) * 2) / 2
        from public.report_cards rc where rc.id = l.report_card_id and rc.council_id = p_council and l.score is null;
    end if;
    update public.report_cards set published_at = now() where council_id = p_council;
    update public.class_councils set status = 'cloture', closed_at = now() where id = p_council;
  else
    update public.class_councils set status = p_status where id = p_council;
  end if;
end $$;

-- ── Saisie : verrous selon l'étape du conseil ─────────────────────
-- Professeur : seulement en préparation. Direction : jusqu'à la clôture.
create or replace function private.report_editable(p_card uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select case when cc.id is null then true
                               when cc.status = 'cloture' then false
                               when private.my_kind() = 'direction' then true
                               else cc.status = 'preparation' end
                   from public.report_cards rc left join public.class_councils cc on cc.id = rc.council_id
                   where rc.id = p_card), false)
$$;

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
  if not private.report_editable(p_report_card) then
    raise exception 'Les appréciations sont figées : le conseil de classe a commencé.';
  end if;
  if p_level is not null and p_level not in ('MI', 'MF', 'MS', 'TB') then raise exception 'Positionnement invalide.'; end if;
  insert into public.report_card_lines (report_card_id, subject_id, level, comment, position, updated_by)
  values (p_report_card, p_subject, coalesce(p_level, 'NE'), coalesce(trim(p_comment), ''),
          coalesce((select max(position) + 1 from public.report_card_lines where report_card_id = p_report_card), 0), private.me())
  on conflict (report_card_id, subject_id) do update
    set level = excluded.level, comment = excluded.comment, updated_by = excluded.updated_by;
end $$;

create or replace function public.set_report_score(p_report_card uuid, p_subject text, p_score numeric)
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
  if not private.report_editable(p_report_card) then
    raise exception 'Les notes sont figées : le conseil de classe a commencé.';
  end if;
  if p_score is not null and (p_score < 0 or p_score > 20 or p_score * 2 <> round(p_score * 2)) then
    raise exception 'Note invalide : de 0 à 20, au demi-point.';
  end if;
  insert into public.report_card_lines (report_card_id, subject_id, level, comment, position, updated_by, score)
  values (p_report_card, p_subject, 'NE', '',
          coalesce((select max(position) + 1 from public.report_card_lines where report_card_id = p_report_card), 0),
          private.me(), p_score)
  on conflict (report_card_id, subject_id) do update set score = excluded.score, updated_by = excluded.updated_by;
end $$;

-- Avis du conseil (appréciation générale + mention) : direction, ou professeur principal pendant le conseil.
create or replace function public.set_report_council(p_report_card uuid, p_mention text, p_text text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_rc public.report_cards; v_cc public.class_councils; v_mention text := nullif(trim(coalesce(p_mention, '')), '');
begin
  select * into v_rc from public.report_cards where id = p_report_card;
  select * into v_cc from public.class_councils where id = v_rc.council_id;
  if v_rc.id is null or private.me() is null or not (
       (private.my_kind() = 'direction' and coalesce(private.can_see_student(v_rc.student_id), false))
       or (v_cc.id is not null and v_cc.head_teacher_id = private.me())) then
    raise exception 'Seuls la direction et le professeur principal rédigent l''avis du conseil.' using errcode = '42501';
  end if;
  if v_cc.id is not null and v_cc.status = 'cloture' then raise exception 'Le conseil est clôturé.'; end if;
  if v_cc.id is not null and v_cc.status = 'preparation' and private.my_kind() <> 'direction' then
    raise exception 'L''avis se rédige pendant le conseil.';
  end if;
  if v_mention is not null and v_mention not in ('Félicitations', 'Compliments', 'Encouragements',
       'Avertissement travail', 'Avertissement assiduité', 'Avertissement comportement') then
    raise exception 'Mention inconnue.';
  end if;
  update public.report_cards set council_mention = v_mention, council_text = nullif(trim(coalesce(p_text, '')), '')
   where id = p_report_card;
end $$;

-- ── Fiches du conseil (personnel) : résultats, moyennes, absences de la période, appréciations ─
create or replace function public.council_sheets(p_council uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_c public.class_councils;
begin
  select * into v_c from public.class_councils where id = p_council;
  if v_c.id is null or not private.council_staff(p_council) then raise exception 'Conseil introuvable' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'student_id', rc.student_id, 'name', p.display_name, 'report_card_id', rc.id,
      'mention', rc.council_mention, 'council_text', rc.council_text,
      'absences', (select count(*) from public.life_events e where e.student_id = rc.student_id and not e.voided and e.kind = 'absence'
                    and (e.occurred_at at time zone 'Europe/Paris')::date between v_c.period_start and v_c.period_end),
      'absences_unjustified', (select count(*) from public.life_events e where e.student_id = rc.student_id and not e.voided and e.kind = 'absence'
                    and e.status <> 'justifie' and (e.occurred_at at time zone 'Europe/Paris')::date between v_c.period_start and v_c.period_end),
      'lates', (select count(*) from public.life_events e where e.student_id = rc.student_id and not e.voided and e.kind = 'retard'
                    and (e.occurred_at at time zone 'Europe/Paris')::date between v_c.period_start and v_c.period_end),
      'subjects', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'subject_id', s.id, 'subject', s.name,
          'average', private.subject_average(rc.student_id, s.id, v_c.period_start, v_c.period_end),
          'score', l.score, 'level', l.level, 'comment', coalesce(l.comment, ''),
          'results', (select coalesce(jsonb_agg(coalesce(r.score::text, r.level::text) order by a.held_on), '[]')
                      from public.assessment_results r join public.assessments a on a.id = r.assessment_id
                      where r.student_id = rc.student_id and a.subject_id = s.id and a.published_at is not null
                        and a.held_on between v_c.period_start and v_c.period_end)
        ) order by s.name), '[]')
        from (select distinct t.subject_id from public.teachings t where t.class_id = v_c.class_id) ts
        join public.subjects s on s.id = ts.subject_id
        left join public.report_card_lines l on l.report_card_id = rc.id and l.subject_id = s.id)
    ) order by p.display_name)
    from public.report_cards rc join public.profiles p on p.id = rc.student_id
    where rc.council_id = p_council), '[]');
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'create_class_council(uuid, smallint, timestamptz, date, date, uuid)',
    'set_council_participant(uuid, uuid, public.council_role)',
    'set_council_status(uuid, public.council_status)',
    'council_sheets(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function private.report_published(uuid) from public, anon;
revoke all on function private.council_staff(uuid) from public, anon;
revoke all on function private.subject_average(uuid, text, date, date) from public, anon;
revoke all on function private.report_editable(uuid) from public, anon;
grant execute on function private.report_published(uuid) to authenticated;
grant execute on function private.council_staff(uuid) to authenticated;
