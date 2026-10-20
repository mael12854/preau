-- Annuler un message programmé avant sa date d'envoi (son expéditeur seulement) : il est supprimé.
create or replace function public.cancel_scheduled_message(p_message uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.messages
                 where id = p_message and sender_id = private.me() and sent_at > now()) then
    raise exception 'Ce message est déjà envoyé, ou introuvable.' using errcode = '42501';
  end if;
  delete from public.message_recipients where message_id = p_message;
  delete from public.messages where id = p_message;
end $$;
revoke all on function public.cancel_scheduled_message(uuid) from public, anon;
grant execute on function public.cancel_scheduled_message(uuid) to authenticated;
