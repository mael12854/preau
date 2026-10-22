-- Les absences et retards de l'appel deviennent des événements de vie scolaire, à justifier.
alter table public.life_events add column if not exists lesson_id uuid references public.lessons(id);
-- Un appel corrigé (absent → présent) annule l'événement sans l'effacer.
alter table public.life_events add column if not exists voided boolean not null default false;
alter table public.life_events add column if not exists review_comment text;
create unique index if not exists life_events_lesson_student on public.life_events (lesson_id, student_id) where lesson_id is not null;

create or replace function private.attendance_to_life_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_l record;
begin
  if new.status in ('absent', 'late') then
    select l.starts_at, l.ends_at, s.name as subject into v_l
      from public.lessons l join public.subjects s on s.id = l.subject_id where l.id = new.lesson_id;
    insert into public.life_events (student_id, kind, occurred_at, whole_day, detail, status, created_by, lesson_id)
    values (new.student_id, case when new.status = 'absent' then 'absence' else 'retard' end::public.life_event_kind,
            v_l.starts_at, false,
            v_l.subject || ' · ' || to_char(v_l.starts_at at time zone 'Europe/Paris', 'HH24:MI') || '–' || to_char(v_l.ends_at at time zone 'Europe/Paris', 'HH24:MI'),
            'a_justifier', new.recorded_by, new.lesson_id)
    on conflict (lesson_id, student_id) where lesson_id is not null do update
      set kind = excluded.kind, detail = excluded.detail, voided = false,
          status = case when public.life_events.voided or public.life_events.kind <> excluded.kind
                        then 'a_justifier'::public.life_event_status else public.life_events.status end;
  else
    update public.life_events set voided = true where lesson_id = new.lesson_id and student_id = new.student_id;
  end if;
  return new;
end $$;

create or replace trigger attendance_life_event after insert or update of status on public.attendance
  for each row execute function private.attendance_to_life_event();

-- Absences déjà relevées.
update public.attendance set status = status where status in ('absent', 'late');

-- Justifier : la famille envoie un justificatif ; la vie scolaire, la direction ou le secrétariat justifient directement.
create or replace function public.justify_life_event(p_event uuid, p_reason text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.life_events; v_staff boolean := private.is_admin_staff();
begin
  if private.me() is null then raise exception 'Compte non rattaché à un établissement' using errcode = '42501'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez un motif pour justifier.'; end if;
  select * into v_e from public.life_events where id = p_event and not voided;
  if v_e.id is null or not coalesce(private.is_family_of(v_e.student_id)
                                    or (v_staff and private.can_see_student(v_e.student_id)), false) then
    raise exception 'Événement introuvable' using errcode = '42501';
  end if;
  if v_e.status = 'justifie' then raise exception 'Cet événement est déjà justifié'; end if;
  if v_e.status = 'justificatif_envoye' and not v_staff then raise exception 'Le justificatif a déjà été envoyé.'; end if;
  update public.life_events
     set status = case when v_staff then 'justifie'::public.life_event_status else 'justificatif_envoye'::public.life_event_status end,
         justification_reason = trim(p_reason),
         justification_comment = nullif(trim(coalesce(p_comment, '')), ''),
         justified_by = private.me(),
         justified_at = now()
   where id = p_event;
end $$;

-- Accepter ou refuser le justificatif envoyé par la famille (vie scolaire, direction, secrétariat).
create or replace function public.review_justification(p_event uuid, p_accept boolean, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_e public.life_events;
begin
  select * into v_e from public.life_events where id = p_event and not voided;
  if v_e.id is null or not private.is_admin_staff() or not private.can_see_student(v_e.student_id) then
    raise exception 'Événement introuvable' using errcode = '42501';
  end if;
  if v_e.status <> 'justificatif_envoye' then raise exception 'Aucun justificatif en attente.'; end if;
  if not p_accept and coalesce(trim(p_comment), '') = '' then raise exception 'Expliquez à la famille pourquoi le justificatif est refusé.'; end if;
  update public.life_events
     set status = case when p_accept then 'justifie' else 'a_justifier' end::public.life_event_status,
         review_comment = nullif(trim(coalesce(p_comment, '')), '')
   where id = p_event;
end $$;

revoke execute on function public.review_justification(uuid, boolean, text) from public, anon;
grant execute on function public.review_justification(uuid, boolean, text) to authenticated;
revoke all on function private.attendance_to_life_event() from public, anon, authenticated;
