-- Préau — sécurité au niveau des lignes (RLS)
-- Principe : un élève ne voit que lui-même, un responsable que ses enfants, un professeur
-- que ses classes, l'administration (CPE, direction, secrétariat) son établissement.
-- Les écritures sensibles passent par des fonctions (security definer) qui vérifient les droits.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ── Fonctions d'aide (exécutées avec les droits du propriétaire, sans RLS) ──
create or replace function private.me() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.profiles where user_id = (select auth.uid())
$$;

create or replace function private.my_kind() returns public.person_kind
language sql stable security definer set search_path = '' as $$
  select kind from public.profiles where user_id = (select auth.uid())
$$;

create or replace function private.my_school() returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where user_id = (select auth.uid())
$$;

create or replace function private.is_admin_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_kind() in ('cpe', 'direction', 'secretariat'), false)
$$;

-- L'élève lui-même ou l'un de ses responsables.
create or replace function private.is_family_of(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_student = private.me()
      or exists (select 1 from public.guardians g where g.student_id = p_student and g.guardian_id = private.me())
$$;

create or replace function private.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teachings t where t.class_id = p_class and t.teacher_id = private.me())
      or exists (select 1 from public.lessons l where l.class_id = p_class and l.teacher_id = private.me())
$$;

create or replace function private.class_of(p_student uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select class_id from public.students where profile_id = p_student
$$;

create or replace function private.can_see_student(p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_family_of(p_student)
      or private.teaches_class(private.class_of(p_student))
      or (private.is_admin_staff() and exists (
            select 1 from public.profiles p where p.id = p_student and p.school_id = private.my_school()))
$$;

create or replace function private.can_see_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.students s where s.class_id = p_class and private.is_family_of(s.profile_id))
      or private.teaches_class(p_class)
      or (private.is_admin_staff() and exists (
            select 1 from public.classes c where c.id = p_class and c.school_id = private.my_school()))
$$;

-- Messagerie : évite la récursion entre les politiques de messages et de destinataires.
create or replace function private.is_sender(p_message uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.messages m where m.id = p_message and m.sender_id = private.me())
$$;

create or replace function private.is_recipient(p_message uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.message_recipients r where r.message_id = p_message and r.recipient_id = private.me())
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ── Activation de la RLS partout ──────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'schools', 'classes', 'profiles', 'profile_private', 'students', 'guardians', 'subjects',
    'teachings', 'lessons', 'attendance', 'homework', 'homework_done', 'assessments',
    'assessment_results', 'life_events', 'messages', 'message_recipients', 'documents',
    'document_signatures', 'agenda_events', 'canteen_accounts', 'menus', 'invoices',
    'report_cards', 'report_card_lines'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke insert, update, delete, truncate on public.%I from authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- ── Lecture ───────────────────────────────────────────────────────
create policy "établissement de l'utilisateur" on public.schools for select to authenticated
  using (id = (select private.my_school()));

create policy "classes de l'établissement" on public.classes for select to authenticated
  using (school_id = (select private.my_school()));

-- Annuaire : noms et fonctions des personnes de l'établissement (sans coordonnées).
create policy "annuaire de l'établissement" on public.profiles for select to authenticated
  using (school_id = (select private.my_school()));

create policy "coordonnées : soi-même ou administration" on public.profile_private for select to authenticated
  using (profile_id = (select private.me())
      or ((select private.is_admin_staff()) and exists (
            select 1 from public.profiles p where p.id = profile_id and p.school_id = (select private.my_school()))));

create policy "élèves visibles" on public.students for select to authenticated
  using ((select private.can_see_student(profile_id)));

create policy "liens de responsabilité" on public.guardians for select to authenticated
  using (guardian_id = (select private.me()) or (select private.can_see_student(student_id)));

create policy "matières" on public.subjects for select to authenticated using (true);

create policy "enseignements des classes visibles" on public.teachings for select to authenticated
  using ((select private.can_see_class(class_id)));

create policy "cours des classes visibles" on public.lessons for select to authenticated
  using (teacher_id = (select private.me()) or (select private.can_see_class(class_id)));

create policy "appel : élèves visibles" on public.attendance for select to authenticated
  using ((select private.can_see_student(student_id)));

create policy "devoirs des classes visibles" on public.homework for select to authenticated
  using ((select private.can_see_class(class_id)));

-- Coche personnelle : seul son auteur la voit et la modifie.
create policy "coche personnelle : lecture" on public.homework_done for select to authenticated
  using (user_id = (select auth.uid()));
create policy "coche personnelle : ajout" on public.homework_done for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.homework h where h.id = homework_id and (select private.can_see_class(h.class_id))));
create policy "coche personnelle : retrait" on public.homework_done for delete to authenticated
  using (user_id = (select auth.uid()));
grant insert, delete on public.homework_done to authenticated;

-- Une évaluation n'est visible des familles qu'une fois publiée.
create policy "évaluations visibles" on public.assessments for select to authenticated
  using (teacher_id = (select private.me())
      or ((select private.is_admin_staff()) and (select private.can_see_class(class_id)))
      or (published_at is not null and (select private.can_see_class(class_id))));

create policy "résultats visibles" on public.assessment_results for select to authenticated
  using (exists (
    select 1 from public.assessments a where a.id = assessment_id and (
         a.teacher_id = (select private.me())
      or ((select private.is_admin_staff()) and (select private.can_see_student(student_id)))
      or (a.published_at is not null and (select private.is_family_of(student_id))))));

create policy "vie scolaire : élèves visibles" on public.life_events for select to authenticated
  using ((select private.can_see_student(student_id)));

create policy "messages envoyés ou reçus" on public.messages for select to authenticated
  using (sender_id = (select private.me()) or (select private.is_recipient(id)));

create policy "destinataires : les miens ou ceux de mes envois" on public.message_recipients for select to authenticated
  using (recipient_id = (select private.me()) or (select private.is_sender(message_id)));
-- Le destinataire ne peut modifier que l'état de lecture et l'archivage.
create policy "destinataire : lu / archivé" on public.message_recipients for update to authenticated
  using (recipient_id = (select private.me())) with check (recipient_id = (select private.me()));
grant update (read_at, archived_at) on public.message_recipients to authenticated;

create policy "documents visibles" on public.documents for select to authenticated
  using (school_id = (select private.my_school())
     and (class_id is null or (select private.can_see_class(class_id)))
     and (student_id is null or (select private.can_see_student(student_id))));

create policy "signatures : les miennes ou administration" on public.document_signatures for select to authenticated
  using (profile_id = (select private.me()) or (select private.is_admin_staff()));

create policy "agenda de l'établissement" on public.agenda_events for select to authenticated
  using (school_id = (select private.my_school()) and (class_id is null or (select private.can_see_class(class_id))));

-- Argent : la famille, le secrétariat et la direction (pas les professeurs).
create policy "solde cantine" on public.canteen_accounts for select to authenticated
  using ((select private.is_family_of(student_id))
      or ((select private.my_kind()) in ('secretariat', 'direction') and (select private.can_see_student(student_id))));

create policy "menus de l'établissement" on public.menus for select to authenticated
  using (school_id = (select private.my_school()));

create policy "factures" on public.invoices for select to authenticated
  using ((select private.is_family_of(student_id))
      or ((select private.my_kind()) in ('secretariat', 'direction') and (select private.can_see_student(student_id))));

-- Bulletins : la liste des périodes est visible, le contenu seulement après publication.
create policy "bulletins" on public.report_cards for select to authenticated
  using ((select private.is_family_of(student_id))
      or ((select private.my_kind()) in ('direction', 'cpe', 'secretariat') and (select private.can_see_student(student_id))));

create policy "lignes de bulletin publiées" on public.report_card_lines for select to authenticated
  using (exists (
    select 1 from public.report_cards rc where rc.id = report_card_id and (
         ((select private.is_family_of(rc.student_id)) and rc.publish_on <= current_date)
      or ((select private.my_kind()) in ('direction', 'cpe', 'secretariat') and (select private.can_see_student(rc.student_id))))));

-- ── Écritures directes autorisées ─────────────────────────────────
-- Coordonnées et réglages de notification : uniquement les siens.
create policy "modifier mes coordonnées" on public.profile_private for update to authenticated
  using (profile_id = (select private.me())) with check (profile_id = (select private.me()));
grant update (phone, notification_settings) on public.profile_private to authenticated;
