-- Préau — actions métier (appelées par l'application via RPC)
-- Chaque fonction vérifie elle-même les droits de l'appelant avant d'écrire.

-- Valider l'appel d'un cours : réservé au professeur du cours (ou à la vie scolaire).
create or replace function public.validate_attendance(p_lesson uuid, p_statuses jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_lesson public.lessons;
  v_me uuid := private.me();
begin
  select * into v_lesson from public.lessons where id = p_lesson;
  if v_lesson.id is null then raise exception 'Cours introuvable'; end if;
  if v_lesson.teacher_id <> v_me and not (private.my_kind() = 'cpe' and private.can_see_class(v_lesson.class_id)) then
    raise exception 'Vous ne pouvez pas faire l''appel de ce cours' using errcode = '42501';
  end if;

  insert into public.attendance (lesson_id, student_id, status, recorded_by)
  select p_lesson, s.profile_id, (p_statuses ->> s.profile_id::text)::public.attendance_status, v_me
  from public.students s
  where s.class_id = v_lesson.class_id and p_statuses ? s.profile_id::text
  on conflict (lesson_id, student_id) do update
    set status = excluded.status, recorded_by = excluded.recorded_by, recorded_at = now();

  update public.lessons set attendance_validated_at = now() where id = p_lesson;
end $$;

-- Saisir le niveau d'un élève (et par compétence) pour une évaluation du professeur.
create or replace function public.set_assessment_result(
  p_assessment uuid, p_student uuid, p_level public.eval_value, p_skill_levels public.eval_value[] default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_a public.assessments;
begin
  select * into v_a from public.assessments where id = p_assessment;
  if v_a.id is null or v_a.teacher_id <> private.me() then
    raise exception 'Évaluation introuvable' using errcode = '42501';
  end if;
  if not exists (select 1 from public.students where profile_id = p_student and class_id = v_a.class_id) then
    raise exception 'Cet élève n''est pas dans la classe';
  end if;
  insert into public.assessment_results (assessment_id, student_id, level, skill_levels)
  values (p_assessment, p_student, p_level, coalesce(p_skill_levels, '{}'))
  on conflict (assessment_id, student_id) do update
    set level = excluded.level,
        skill_levels = coalesce(p_skill_levels, public.assessment_results.skill_levels),
        updated_at = now();
end $$;

-- Publier une évaluation : elle devient visible des élèves et des familles.
create or replace function public.publish_assessment(p_assessment uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.assessments set published_at = coalesce(published_at, now())
  where id = p_assessment and teacher_id = private.me();
  if not found then raise exception 'Évaluation introuvable' using errcode = '42501'; end if;
end $$;

-- Justifier une absence ou un retard : l'élève, un responsable ou la vie scolaire.
create or replace function public.justify_life_event(p_event uuid, p_reason text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.life_events;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez un motif pour justifier.'; end if;
  select * into v_e from public.life_events where id = p_event;
  if v_e.id is null or not (private.is_family_of(v_e.student_id)
                            or (private.my_kind() = 'cpe' and private.can_see_student(v_e.student_id))) then
    raise exception 'Événement introuvable' using errcode = '42501';
  end if;
  if v_e.status <> 'a_justifier' then raise exception 'Cet événement est déjà justifié'; end if;
  update public.life_events
     set status = case when private.my_kind() = 'cpe' then 'justifie'::public.life_event_status
                       else 'justificatif_envoye'::public.life_event_status end,
         justification_reason = trim(p_reason),
         justification_comment = nullif(trim(coalesce(p_comment, '')), ''),
         justified_by = private.me(),
         justified_at = now()
   where id = p_event;
end $$;

-- Envoyer un message à des personnes du même établissement.
create or replace function public.send_message(
  p_recipients uuid[], p_subject text, p_body text, p_reply_to uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := private.me();
  v_school uuid := private.my_school();
  v_id uuid;
begin
  if v_me is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if coalesce(array_length(p_recipients, 1), 0) = 0 then raise exception 'Choisissez au moins un destinataire'; end if;
  if exists (select 1 from unnest(p_recipients) r(id)
             where not exists (select 1 from public.profiles p where p.id = r.id and p.school_id = v_school)) then
    raise exception 'Destinataire inconnu';
  end if;
  if p_reply_to is not null and not (private.is_recipient(p_reply_to) or private.is_sender(p_reply_to)) then
    raise exception 'Message introuvable';
  end if;
  insert into public.messages (school_id, sender_id, subject, body, reply_to)
  values (v_school, v_me, trim(p_subject), p_body, p_reply_to) returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select distinct v_id, r from unnest(p_recipients) r where r <> v_me;
  return v_id;
end $$;

-- Recharger le compte cantine (paiement simulé : à brancher sur un prestataire de paiement).
create or replace function public.top_up_canteen(p_student uuid, p_amount_cents integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_balance integer;
begin
  if not exists (select 1 from public.guardians where guardian_id = private.me() and student_id = p_student) then
    raise exception 'Seul un responsable peut recharger ce compte' using errcode = '42501';
  end if;
  if p_amount_cents not between 500 and 20000 then raise exception 'Montant non autorisé'; end if;
  update public.canteen_accounts set balance_cents = balance_cents + p_amount_cents
   where student_id = p_student returning balance_cents into v_balance;
  insert into public.invoices (student_id, label, amount_cents, status, paid_on, method)
  values (p_student, 'Rechargement cantine', p_amount_cents, 'creditee', current_date, 'carte bancaire');
  return v_balance;
end $$;

-- Payer une facture (paiement simulé).
create or replace function public.pay_invoice(p_invoice uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.invoices i set status = 'payee', paid_on = current_date, method = 'carte bancaire'
   where i.id = p_invoice and i.status = 'a_payer'
     and exists (select 1 from public.guardians g where g.guardian_id = private.me() and g.student_id = i.student_id);
  if not found then raise exception 'Facture introuvable ou déjà réglée' using errcode = '42501'; end if;
end $$;

-- Signer un document visible.
create or replace function public.sign_document(p_document uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_d public.documents;
begin
  select * into v_d from public.documents where id = p_document and requires_signature;
  if v_d.id is null or v_d.school_id <> private.my_school()
     or (v_d.class_id is not null and not private.can_see_class(v_d.class_id)) then
    raise exception 'Document introuvable' using errcode = '42501';
  end if;
  insert into public.document_signatures (document_id, profile_id) values (p_document, private.me())
  on conflict do nothing;
end $$;

revoke all on function public.validate_attendance(uuid, jsonb) from public, anon;
revoke all on function public.set_assessment_result(uuid, uuid, public.eval_value, public.eval_value[]) from public, anon;
revoke all on function public.publish_assessment(uuid) from public, anon;
revoke all on function public.justify_life_event(uuid, text, text) from public, anon;
revoke all on function public.send_message(uuid[], text, text, uuid) from public, anon;
revoke all on function public.top_up_canteen(uuid, integer) from public, anon;
revoke all on function public.pay_invoice(uuid) from public, anon;
revoke all on function public.sign_document(uuid) from public, anon;
grant execute on function public.validate_attendance(uuid, jsonb) to authenticated;
grant execute on function public.set_assessment_result(uuid, uuid, public.eval_value, public.eval_value[]) to authenticated;
grant execute on function public.publish_assessment(uuid) to authenticated;
grant execute on function public.justify_life_event(uuid, text, text) to authenticated;
grant execute on function public.send_message(uuid[], text, text, uuid) to authenticated;
grant execute on function public.top_up_canteen(uuid, integer) to authenticated;
grant execute on function public.pay_invoice(uuid) to authenticated;
grant execute on function public.sign_document(uuid) to authenticated;
