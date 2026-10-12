-- Classes supplémentaires : un élève garde sa classe principale (students.class_id) et peut suivre
-- d'autres classes en plus (par exemple « Cours Sup » à l'École du Weekend).
-- Emploi du temps, devoirs, agenda, cahier de liaison, évaluations et bulletins de ces classes
-- deviennent visibles de l'élève et de sa famille ; leurs enseignants voient l'élève.

create table public.class_members (
  student_id uuid not null references public.students (profile_id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (student_id, class_id)
);
create index on public.class_members (class_id);
alter table public.class_members enable row level security;
revoke all on public.class_members from anon;
revoke insert, update, delete, truncate on public.class_members from authenticated;
grant select on public.class_members to authenticated;

-- L'élève suit la classe : sa classe principale ou une classe supplémentaire.
create or replace function private.in_class(p_student uuid, p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.students s where s.profile_id = p_student and s.class_id = p_class)
      or exists (select 1 from public.class_members m where m.student_id = p_student and m.class_id = p_class)
$$;

-- La personne connectée enseigne dans l'une des classes de l'élève.
create or replace function private.teaches_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.teaches_class(private.class_of(p_student))
      or exists (select 1 from public.class_members m where m.student_id = p_student and private.teaches_class(m.class_id))
$$;

create or replace function private.can_see_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_family_of(p_student)
      or private.teaches_student(p_student)
      or (private.is_admin_staff() and exists (
            select 1 from public.profiles p where p.id = p_student and p.school_id = private.my_school()))
$$;

create or replace function private.can_see_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.students s where s.class_id = p_class and private.is_family_of(s.profile_id))
      or exists (select 1 from public.class_members m where m.class_id = p_class and private.is_family_of(m.student_id))
      or private.teaches_class(p_class)
      or (private.is_admin_staff() and exists (
            select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()))
$$;

create or replace function private.teaches_subject_to(p_student uuid, p_subject text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.teachings t
    where t.subject_id = p_subject and t.teacher_id = private.me() and private.in_class(p_student, t.class_id))
  or exists (
    select 1 from public.classes c where c.teacher_id = private.me() and private.in_class(p_student, c.id))
$$;

create policy "classes supplémentaires : élèves visibles" on public.class_members for select to authenticated
  using ((select private.can_see_student(student_id)));

alter policy "bulletins : professeurs de la classe" on public.report_cards
  using ((select private.my_kind()) = 'prof' and (select private.teaches_student(student_id)));
alter policy "lignes de bulletin : professeurs de la classe" on public.report_card_lines
  using ((select private.my_kind()) = 'prof' and exists (
    select 1 from public.report_cards rc where rc.id = report_card_id and (select private.teaches_student(rc.student_id))));

-- ── Fonctions d'écriture : « élève de la classe » inclut les classes supplémentaires ──
create or replace function public.validate_attendance(p_lesson uuid, p_statuses jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_lesson public.lessons;
  v_me uuid := private.me();
begin
  if v_me is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_lesson from public.lessons where id = p_lesson;
  if v_lesson.id is null then raise exception 'Cours introuvable'; end if;
  if v_lesson.teacher_id is distinct from v_me
     and not coalesce(private.my_kind() = 'cpe' and private.can_see_class(v_lesson.class_id), false) then
    raise exception 'Vous ne pouvez pas faire l''appel de ce cours' using errcode = '42501';
  end if;

  insert into public.attendance (lesson_id, student_id, status, recorded_by)
  select p_lesson, s.profile_id, (p_statuses ->> s.profile_id::text)::public.attendance_status, v_me
  from public.students s
  where private.in_class(s.profile_id, v_lesson.class_id) and p_statuses ? s.profile_id::text
  on conflict (lesson_id, student_id) do update
    set status = excluded.status, recorded_by = excluded.recorded_by, recorded_at = now();

  update public.lessons set attendance_validated_at = now() where id = p_lesson;
end $$;

create or replace function public.set_assessment_result(
  p_assessment uuid, p_student uuid, p_level public.eval_value, p_skill_levels public.eval_value[] default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_a public.assessments;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_a from public.assessments where id = p_assessment;
  if v_a.id is null or v_a.teacher_id is distinct from private.me() then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  if not private.in_class(p_student, v_a.class_id) then raise exception 'Cet élève n''est pas dans la classe'; end if;
  insert into public.assessment_results (assessment_id, student_id, level, skill_levels)
  values (p_assessment, p_student, p_level, coalesce(p_skill_levels, '{}'))
  on conflict (assessment_id, student_id) do update
    set level = excluded.level,
        skill_levels = coalesce(p_skill_levels, public.assessment_results.skill_levels),
        updated_at = now();
end $$;

create or replace function public.set_assessment_score(
  p_assessment uuid, p_student uuid, p_score numeric, p_status public.eval_value default 'NE'
) returns void language plpgsql security definer set search_path = '' as $$
declare v_a public.assessments;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_a from public.assessments where id = p_assessment;
  if v_a.id is null or v_a.teacher_id is distinct from private.me() then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  if (select s.grading from public.classes c join public.schools s on s.id = c.school_id where c.id = v_a.class_id)
     is distinct from 'note20' then
    raise exception 'Cet établissement évalue par compétences';
  end if;
  if not private.in_class(p_student, v_a.class_id) then raise exception 'Cet élève n''est pas dans la classe'; end if;
  if p_status not in ('NE', 'ABS', 'DISP') then raise exception 'Statut invalide'; end if;
  insert into public.assessment_results (assessment_id, student_id, level, score)
  values (p_assessment, p_student, case when p_score is null then p_status else 'NE' end, p_score)
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, level = excluded.level, updated_at = now();
end $$;

create or replace function public.sign_liaison_note(p_note uuid, p_student uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.liaison_notes n
    join public.guardians g on g.student_id = p_student and g.guardian_id = private.me()
    where n.id = p_note and n.requires_signature and private.in_class(p_student, n.class_id)
  ) then
    raise exception 'Mot introuvable' using errcode = '42501';
  end if;
  insert into public.liaison_signatures (note_id, student_id, guardian_id) values (p_note, p_student, private.me())
  on conflict do nothing;
end $$;

-- Bulletins : un par élève et par trimestre. Préparer ceux d'une classe supplémentaire crée le bulletin
-- des élèves qui n'en ont pas encore ; le professeur de cette classe y ajoute sa ligne.
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
  on conflict (student_id, school_year, term) do update set publish_on = excluded.publish_on;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Inscrire un élève dans une classe supplémentaire (secrétariat, direction).
create or replace function public.add_class_member(p_student uuid, p_class uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.manageable_person(p_student);
  if not exists (select 1 from public.students where profile_id = p_student) then raise exception 'Seul un élève suit une classe.'; end if;
  if not exists (select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()) then
    raise exception 'Classe introuvable' using errcode = '42501';
  end if;
  if exists (select 1 from public.students where profile_id = p_student and class_id = p_class) then
    raise exception 'C''est déjà la classe principale de l''élève.';
  end if;
  insert into public.class_members (student_id, class_id) values (p_student, p_class) on conflict do nothing;
end $$;

revoke all on function public.add_class_member(uuid, uuid) from public, anon;
revoke all on function private.in_class(uuid, uuid) from public, anon;
revoke all on function private.teaches_student(uuid) from public, anon;
grant execute on function public.add_class_member(uuid, uuid) to authenticated;
grant execute on function private.in_class(uuid, uuid) to authenticated;
grant execute on function private.teaches_student(uuid) to authenticated;
