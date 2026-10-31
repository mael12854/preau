-- Demande de justificatif pour n'importe quelle absence ou retard (quelle que soit sa date) :
-- l'événement repasse « à justifier » et la famille (ou l'élève sans responsable) reçoit un message.
create or replace function public.request_justification(p_event uuid, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.life_events; v_st record; v_id uuid; v_self boolean; v_when text; v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_days text[] := array['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  v_months text[] := array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  v_t timestamp;
begin
  select * into v_e from public.life_events where id = p_event and not voided;
  if v_e.id is null or private.me() is null
     or not (private.teaches_student(v_e.student_id) or (private.is_admin_staff() and private.can_see_student(v_e.student_id))) then
    raise exception 'Événement introuvable' using errcode = '42501';
  end if;
  if v_e.kind not in ('absence', 'retard') then raise exception 'Seules les absences et les retards se justifient.'; end if;
  update public.life_events
     set status = 'a_justifier', review_comment = coalesce(v_note, review_comment)
   where id = p_event;

  select first_name, display_name, school_id into v_st from public.profiles where id = v_e.student_id;
  v_self := not exists (select 1 from public.guardians g where g.student_id = v_e.student_id);
  v_t := v_e.occurred_at at time zone 'Europe/Paris';
  v_when := v_days[extract(isodow from v_t)::int] || ' ' || extract(day from v_t)::int || ' ' || v_months[extract(month from v_t)::int]
            || case when v_e.whole_day then ' (journée entière)' else ' · ' || v_e.detail end;
  insert into public.messages (school_id, sender_id, subject, body)
  values (v_st.school_id, private.me(),
    'Justificatif demandé · ' || case when v_e.kind = 'retard' then 'retard' else 'absence' end || ' de ' || coalesce(v_st.first_name, v_st.display_name),
    'Bonjour,' || E'\n\n'
    || case when v_self then 'Merci de justifier votre ' else 'Merci de justifier l''' end
    || case when v_e.kind = 'retard' then case when v_self then 'retard' else 'retard de ' || v_st.display_name end
            else case when v_self then 'absence' else 'absence de ' || v_st.display_name end end
    || ' du ' || v_when || '.'
    || coalesce(E'\n\n' || v_note, '')
    || E'\n\n' || 'Dans Préau : Vie scolaire, puis « Justifier ». Vous pouvez aussi répondre à ce message.')
  returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select v_id, r from (
    select g.guardian_id as r from public.guardians g where g.student_id = v_e.student_id
    union select v_e.student_id where v_self) x
  where r <> private.me();
end $$;
revoke execute on function public.request_justification(uuid, text) from public, anon;
grant execute on function public.request_justification(uuid, text) to authenticated;

-- Toutes les absences et retards non justifiés d'un élève : un seul message qui les liste.
create or replace function public.request_student_justifications(p_student uuid, p_note text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_st record; v_id uuid; v_self boolean; v_list text; v_n int; v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_days text[] := array['lun.','mar.','mer.','jeu.','ven.','sam.','dim.'];
begin
  if private.me() is null or not (private.teaches_student(p_student) or (private.is_admin_staff() and private.can_see_student(p_student))) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  select count(*), string_agg('• ' || case when e.kind = 'retard' then 'Retard' else 'Absence' end || ' · '
           || v_days[extract(isodow from e.occurred_at at time zone 'Europe/Paris')::int] || ' '
           || to_char(e.occurred_at at time zone 'Europe/Paris', 'DD/MM') || ' · '
           || case when e.whole_day then 'journée entière' else e.detail end, E'\n' order by e.occurred_at)
    into v_n, v_list
    from public.life_events e
   where e.student_id = p_student and not e.voided and e.kind in ('absence', 'retard') and e.status = 'a_justifier';
  if v_n = 0 then raise exception 'Aucune absence à justifier pour cet élève.'; end if;
  update public.life_events set review_comment = coalesce(v_note, review_comment)
   where student_id = p_student and not voided and kind in ('absence', 'retard') and status = 'a_justifier';
  select first_name, display_name, school_id into v_st from public.profiles where id = p_student;
  v_self := not exists (select 1 from public.guardians g where g.student_id = p_student);
  insert into public.messages (school_id, sender_id, subject, body)
  values (v_st.school_id, private.me(),
    'Justificatifs demandés · ' || coalesce(v_st.first_name, v_st.display_name) || ' (' || v_n || ')',
    'Bonjour,' || E'\n\n'
    || case when v_self then 'Merci de justifier ' else 'Merci de justifier, pour ' || v_st.display_name || ', ' end
    || case when v_n > 1 then 'ces ' || v_n || ' absences ou retards :' else 'cette absence ou ce retard :' end
    || E'\n\n' || v_list
    || coalesce(E'\n\n' || v_note, '')
    || E'\n\n' || 'Dans Préau : Vie scolaire, puis « Justifier » sur chaque ligne. Vous pouvez aussi répondre à ce message.')
  returning id into v_id;
  insert into public.message_recipients (message_id, recipient_id)
  select v_id, r from (
    select g.guardian_id as r from public.guardians g where g.student_id = p_student
    union select p_student where v_self) x
  where r <> private.me();
  return v_n;
end $$;
revoke execute on function public.request_student_justifications(uuid, text) from public, anon;
grant execute on function public.request_student_justifications(uuid, text) to authenticated;
