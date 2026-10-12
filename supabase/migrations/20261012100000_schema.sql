-- Préau — schéma de base
-- Règle métier : aucune note chiffrée, aucune moyenne, aucun classement.
-- Les évaluations ne stockent que des niveaux de maîtrise (type eval_value) : il n'existe
-- aucune colonne numérique de note dans ce schéma, et aucune ne doit être ajoutée.

create extension if not exists pgcrypto with schema extensions;

-- ── Types ─────────────────────────────────────────────────────────
create type public.person_kind as enum ('eleve', 'parent', 'prof', 'cpe', 'direction', 'secretariat');
create type public.school_level as enum ('college', 'lycee');
create type public.civility as enum ('madame', 'monsieur');
create type public.eval_value as enum ('MI', 'MF', 'MS', 'TB', 'NE', 'ABS', 'DISP');
create type public.attendance_status as enum ('present', 'absent', 'late');
create type public.life_event_kind as enum ('absence', 'retard', 'oubli', 'sanction', 'encouragement');
create type public.life_event_status as enum ('a_justifier', 'justificatif_envoye', 'justifie', 'note');
create type public.doc_category as enum ('administratif', 'pedagogique', 'cantine');
create type public.tone as enum ('ok', 'danger', 'warn', 'info', 'neutral', 'brand');
create type public.invoice_status as enum ('a_payer', 'payee', 'creditee');

-- ── Établissement ─────────────────────────────────────────────────
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  year_label text not null
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,                 -- « 4e B », « 1re 3 »
  level public.school_level not null,
  unique (school_id, name)
);

-- Une personne de l'établissement. user_id est nul tant qu'aucun compte n'est ouvert
-- (élèves sans compte, services comme « Vie scolaire »).
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  school_id uuid not null references public.schools (id) on delete cascade,
  kind public.person_kind not null,
  first_name text,
  last_name text,
  civility public.civility,
  display_name text not null,         -- « Léa Martin », « Mme Petit », « Vie scolaire »
  initials text not null,
  role_label text,                    -- barre latérale : « Mathématiques », « Principal »
  title text,                         -- messagerie : « Professeure de français »
  specialities text,                  -- lycée : « Spé. Maths, SES »
  created_at timestamptz not null default now()
);
create index on public.profiles (school_id);

-- Coordonnées et réglages : visibles par la personne et par l'administration seulement.
create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  email text,
  phone text,
  notification_settings jsonb not null default
    '{"evaluations": true, "devoirs": true, "messages": true, "absences": true}'::jsonb
);

create table public.students (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict
);
create index on public.students (class_id);

create table public.guardians (
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  primary key (guardian_id, student_id)
);
create index on public.guardians (student_id);

-- ── Enseignement ──────────────────────────────────────────────────
create table public.subjects (
  id text primary key,                -- « ma », « fr »…
  name text not null,
  hue smallint not null check (hue between 0 and 359),
  skills text[] not null default '{}'
);

create table public.teachings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  is_head_teacher boolean not null default false,
  unique (class_id, subject_id)
);
create index on public.teachings (teacher_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  room text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  cancelled boolean not null default false,
  attendance_validated_at timestamptz
);
create index on public.lessons (class_id, starts_at);
create index on public.lessons (teacher_id, starts_at);

create table public.attendance (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid references public.profiles (id),
  recorded_at timestamptz not null default now(),
  primary key (lesson_id, student_id)
);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  content text not null,
  given_on date not null,
  due_on date not null,
  is_exam boolean not null default false,
  attachment_name text
);
create index on public.homework (class_id, due_on);

-- Coche « fait » : personnelle, visible de son seul auteur (jamais du professeur).
create table public.homework_done (
  homework_id uuid not null references public.homework (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (homework_id, user_id)
);

-- ── Évaluations (par compétences uniquement) ──────────────────────
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  held_on date not null,
  term smallint not null check (term between 1 and 3),
  skills text[] not null,
  published_at timestamptz
);
create index on public.assessments (class_id, term);

create table public.assessment_results (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  level public.eval_value not null default 'NE',
  skill_levels public.eval_value[] not null default '{}',
  comment text,
  updated_at timestamptz not null default now(),
  primary key (assessment_id, student_id)
);
create index on public.assessment_results (student_id);

-- ── Vie scolaire ──────────────────────────────────────────────────
create table public.life_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  kind public.life_event_kind not null,
  occurred_at timestamptz not null,
  whole_day boolean not null default false,
  detail text not null,
  status public.life_event_status not null,
  justification_reason text,
  justification_comment text,
  justified_by uuid references public.profiles (id),
  justified_at timestamptz,
  created_by uuid references public.profiles (id)
);
create index on public.life_events (student_id, occurred_at desc);

-- ── Messagerie ────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 20000),
  reply_to uuid references public.messages (id) on delete set null,
  sent_at timestamptz not null default now()
);
create index on public.messages (sender_id, sent_at desc);

create table public.message_recipients (
  message_id uuid not null references public.messages (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz,
  archived_at timestamptz,
  primary key (message_id, recipient_id)
);
create index on public.message_recipients (recipient_id);

-- ── Documents et agenda ───────────────────────────────────────────
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,      -- nul : tout l'établissement
  student_id uuid references public.students (profile_id) on delete cascade, -- document personnel
  title text not null,
  category public.doc_category not null,
  icon text not null default 'description',
  size_bytes integer not null default 0,
  storage_path text,
  requires_signature boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.documents (school_id, created_at desc);

create table public.document_signatures (
  document_id uuid not null references public.documents (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  signed_at timestamptz not null default now(),
  primary key (document_id, profile_id)
);

create table public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  title text not null,
  tone public.tone not null default 'neutral',
  starts_on date not null,
  ends_on date,
  is_holiday boolean not null default false
);
create index on public.agenda_events (school_id, starts_on);

-- ── Cantine et paiements (montants en centimes) ───────────────────
create table public.canteen_accounts (
  student_id uuid primary key references public.students (profile_id) on delete cascade,
  balance_cents integer not null default 0,
  meal_price_cents integer not null default 450
);

create table public.menus (
  school_id uuid not null references public.schools (id) on delete cascade,
  served_on date not null,
  items text[] not null,
  primary key (school_id, served_on)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  label text not null,
  amount_cents integer not null check (amount_cents > 0),
  status public.invoice_status not null,
  due_on date,
  paid_on date,
  method text,
  created_at timestamptz not null default now()
);
create index on public.invoices (student_id, created_at desc);

-- ── Bulletins ─────────────────────────────────────────────────────
create table public.report_cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (profile_id) on delete cascade,
  school_year text not null,          -- « 2025–2026 »
  term smallint not null check (term between 1 and 3),
  class_name text not null,           -- classe de l'année concernée
  head_teacher text,
  publish_on date not null,
  council_mention text,
  council_text text,
  unique (student_id, school_year, term)
);

create table public.report_card_lines (
  report_card_id uuid not null references public.report_cards (id) on delete cascade,
  subject_id text not null references public.subjects (id),
  level public.eval_value not null,
  comment text not null,
  position smallint not null default 0,
  primary key (report_card_id, subject_id)
);
