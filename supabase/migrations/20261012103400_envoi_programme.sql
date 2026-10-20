-- Messagerie : envoi programmé. Un message programmé a une date d'envoi (sent_at) dans le futur :
-- l'expéditeur le voit dans « Envoyés » (programmé), les destinataires seulement à partir de cette date.
-- L'e-mail de notification part à ce moment-là (tâche planifiée chaque minute) ; notified_at évite les doublons.

alter table public.messages add column notified_at timestamptz;
-- Messages déjà envoyés : pas de notification rétroactive.
update public.messages set notified_at = coalesce(sent_at, now()) where notified_at is null;

-- Destinataire : seulement les messages dont la date d'envoi est passée.
create or replace function private.is_recipient(p_message uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.message_recipients r join public.messages m on m.id = r.message_id
    where r.message_id = p_message and r.recipient_id = private.me() and m.sent_at <= now())
$$;

create or replace function private.is_delivered(p_message uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.messages m where m.id = p_message and m.sent_at <= now())
$$;
revoke all on function private.is_delivered(uuid) from public, anon;
grant execute on function private.is_delivered(uuid) to authenticated;

alter policy "destinataires : les miens ou ceux de mes envois" on public.message_recipients
  using (((recipient_id = (select private.me())) and private.is_delivered(message_id))
         or (select private.is_sender(message_recipients.message_id)));
alter policy "destinataire : lu / archivé" on public.message_recipients
  using ((recipient_id = (select private.me())) and private.is_delivered(message_id));

-- Programmer un message : comme send_message, avec une date d'envoi à venir (dans l'année).
create or replace function public.schedule_message(
  p_recipients uuid[], p_subject text, p_body text, p_send_at timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_send_at is null or p_send_at < now() + interval '1 minute' then
    raise exception 'Choisissez une date et une heure à venir.';
  end if;
  if p_send_at > now() + interval '1 year' then raise exception 'La date d''envoi est trop lointaine.'; end if;
  v_id := public.send_message(p_recipients, p_subject, p_body, null);
  update public.messages set sent_at = p_send_at where id = v_id;
  return v_id;
end $$;
revoke all on function public.schedule_message(uuid[], text, text, timestamptz) from public, anon;
grant execute on function public.schedule_message(uuid[], text, text, timestamptz) to authenticated;

-- Notification : réserver un message (une seule fois), ou les messages arrivés à leur heure (serveur uniquement).
create or replace function public.claim_message_notification(p_message uuid)
returns boolean language sql security definer set search_path = '' as $$
  with c as (
    update public.messages set notified_at = now()
    where id = p_message and notified_at is null and sent_at <= now() returning id)
  select exists (select 1 from c)
$$;
create or replace function public.claim_due_notifications()
returns setof uuid language sql security definer set search_path = '' as $$
  update public.messages set notified_at = now()
  where notified_at is null and sent_at <= now() and sent_at > now() - interval '2 days'
  returning id
$$;
revoke all on function public.claim_message_notification(uuid) from public, anon, authenticated;
revoke all on function public.claim_due_notifications() from public, anon, authenticated;
grant execute on function public.claim_message_notification(uuid) to service_role;
grant execute on function public.claim_due_notifications() to service_role;

-- Chaque minute : demander au site d'envoyer les notifications arrivées à leur heure.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('preau-notifications', '* * * * *',
  $$select net.http_get('https://logiciel-preau.vercel.app/api/notifications')$$);
