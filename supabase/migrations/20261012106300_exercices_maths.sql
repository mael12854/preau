-- Exercices de maths en ligne : séries données par un enseignant à une classe, et tentatives des élèves.
-- Les énoncés sont tirés d'une graine (banque d'exercices dans le code) ; seul le serveur corrige et enregistre les tentatives.

create table public.math_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id),
  class_id uuid not null references public.classes (id),
  teacher_id uuid not null references public.profiles (id),
  title text not null check (char_length(title) between 1 and 120),
  exercise_ids text[] not null check (cardinality(exercise_ids) between 1 and 30),
  per_exercise smallint not null default 3 check (per_exercise between 1 and 10),
  due_on date not null,
  max_attempts smallint check (max_attempts between 1 and 20),
  to_evaluation boolean not null default false,
  assessment_id uuid references public.assessments (id),
  created_at timestamptz not null default now(),
  removed_at timestamptz
);
create index on public.math_assignments (class_id, due_on);
create index on public.math_assignments (teacher_id);

create table public.math_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.math_assignments (id),   -- nul : entraînement libre
  student_id uuid not null references public.students (profile_id),
  exercise_ids text[] not null,
  per_exercise smallint not null,
  seed bigint not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  good smallint,
  total smallint,
  score numeric(4, 2),
  answers jsonb,
  results jsonb
);
create index on public.math_attempts (student_id, started_at desc);
create index on public.math_attempts (assignment_id);

alter table public.math_assignments enable row level security;
alter table public.math_attempts enable row level security;

create policy "séries d'exercices : classe" on public.math_assignments for select to authenticated
  using (removed_at is null and (teacher_id = (select private.me()) or (select private.can_see_class(class_id))));

create policy "tentatives : élève, famille, enseignant, administration" on public.math_attempts for select to authenticated
  using ((select private.is_family_of(student_id))
      or exists (select 1 from public.math_assignments a where a.id = assignment_id and a.teacher_id = (select private.me()))
      or ((select private.is_admin_staff()) and (select private.can_see_student(student_id))));

revoke all on public.math_assignments, public.math_attempts from anon;
revoke insert, update on public.math_assignments, public.math_attempts from authenticated;

-- Donner une série à une classe (enseignant de la classe). Si elle compte dans les évaluations,
-- une évaluation publiée « Exercices en ligne » est créée en mathématiques ; les meilleures notes y arrivent.
create or replace function public.create_math_assignment(
  p_class uuid, p_title text, p_exercises text[], p_per smallint, p_due date, p_max smallint, p_to_eval boolean, p_skills text[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_a uuid; v_grading text; v_term smallint;
begin
  if private.me() is null or private.my_kind() <> 'prof' or not private.teaches_class(p_class) then
    raise exception 'Seul un enseignant de la classe donne des exercices.' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Donnez un titre à la série.'; end if;
  if coalesce(cardinality(p_exercises), 0) = 0 then raise exception 'Choisissez au moins un exercice.'; end if;
  if cardinality(p_exercises) > 30 then raise exception '30 exercices au plus par série.'; end if;
  if p_due is null or p_due < (now() at time zone 'Europe/Paris')::date then raise exception 'Choisissez une date à venir.'; end if;
  if coalesce(p_to_eval, false) then
    select s.grading::text into v_grading from public.classes c join public.schools s on s.id = c.school_id where c.id = p_class;
    v_term := case when extract(month from p_due) between 9 and 12 then 1 when extract(month from p_due) between 1 and 3 then 2 else 3 end;
    insert into public.assessments (class_id, subject_id, teacher_id, title, held_on, term, skills, published_at)
    values (p_class, 'ma', private.me(), left('Exercices en ligne · ' || trim(p_title), 120), p_due, v_term,
            case when v_grading = 'note20' then '{}'::text[] else coalesce(p_skills[1:12], array['Exercices en ligne']) end, now())
    returning id into v_a;
  end if;
  insert into public.math_assignments (school_id, class_id, teacher_id, title, exercise_ids, per_exercise, due_on, max_attempts, to_evaluation, assessment_id)
  values (private.my_school(), p_class, private.me(), left(trim(p_title), 120), p_exercises, coalesce(p_per, 3), p_due, p_max, coalesce(p_to_eval, false), v_a)
  returning id into v_id;
  return v_id;
end $$;

-- Retirer une série (son enseignant) : elle disparaît pour les élèves ; les notes déjà données restent dans les évaluations.
create or replace function public.remove_math_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.math_assignments set removed_at = now() where id = p_id and teacher_id = private.me() and removed_at is null;
  if not found then raise exception 'Série introuvable' using errcode = '42501'; end if;
end $$;

revoke all on function public.create_math_assignment(uuid, text, text[], smallint, date, smallint, boolean, text[]), public.remove_math_assignment(uuid) from public, anon;
grant execute on function public.create_math_assignment(uuid, text, text[], smallint, date, smallint, boolean, text[]), public.remove_math_assignment(uuid) to authenticated;
