-- Refus explicite des comptes sans profil Préau dans les fonctions d'écriture.
-- Faille corrigée : avec private.me() nul, des tests comme « teacher_id <> private.me() » valent NULL,
-- et « if … then raise » ne se déclenche pas. Un compte authentifié mais rattaché à aucun profil
-- pouvait ainsi saisir des résultats, faire un appel, justifier une absence ou signer un document.
-- Chaque fonction refuse désormais d'emblée un compte sans profil, et les comparaisons
-- utilisent « is distinct from » ou coalesce(…, false), qui ne laissent jamais passer une valeur nulle.

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
  where s.class_id = v_lesson.class_id and p_statuses ? s.profile_id::text
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
  if not exists (select 1 from public.students where profile_id = p_student and class_id = v_a.class_id) then
    raise exception 'Cet élève n''est pas dans la classe';
  end if;
  if p_status not in ('NE', 'ABS', 'DISP') then raise exception 'Statut invalide'; end if;
  insert into public.assessment_results (assessment_id, student_id, level, score)
  values (p_assessment, p_student, case when p_score is null then p_status else 'NE' end, p_score)
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, level = excluded.level, updated_at = now();
end $$;

create or replace function public.justify_life_event(p_event uuid, p_reason text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.life_events;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez un motif pour justifier.'; end if;
  select * into v_e from public.life_events where id = p_event;
  if v_e.id is null or not coalesce(private.is_family_of(v_e.student_id)
                                    or (private.my_kind() = 'cpe' and private.can_see_student(v_e.student_id)), false) then
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

create or replace function public.sign_document(p_document uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_d public.documents;
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  select * into v_d from public.documents where id = p_document and requires_signature;
  if v_d.id is null or v_d.school_id is distinct from private.my_school()
     or (v_d.class_id is not null and not coalesce(private.can_see_class(v_d.class_id), false)) then
    raise exception 'Document introuvable' using errcode = '42501';
  end if;
  insert into public.document_signatures (document_id, profile_id) values (p_document, private.me())
  on conflict do nothing;
end $$;
