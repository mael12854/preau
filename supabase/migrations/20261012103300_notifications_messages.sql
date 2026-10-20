-- Notification par e-mail d'un nouveau message (serveur uniquement, clé service_role) :
-- une ligne par destinataire qui accepte les notifications « messages », avec l'adresse de son compte.
create or replace function public.message_email_targets(p_message uuid)
returns table (email text, recipient_name text, sender_name text, subject text, school_name text)
language sql stable security definer set search_path = '' as $$
  select distinct on (lower(coalesce(u.email, lu.email, pp.email)))
         coalesce(u.email, lu.email, pp.email), r.display_name, s.display_name, m.subject, sc.name
  from public.messages m
  join public.message_recipients mr on mr.message_id = m.id
  join public.profiles r on r.id = mr.recipient_id
  join public.profiles s on s.id = m.sender_id
  join public.schools sc on sc.id = m.school_id
  left join public.profile_private pp on pp.profile_id = r.id
  left join auth.users u on u.id = r.user_id
  left join public.profile_links pl on pl.profile_id = r.id
  left join auth.users lu on lu.id = pl.user_id
  where m.id = p_message
    and coalesce(u.email, lu.email, pp.email) is not null
    and coalesce((pp.notification_settings ->> 'messages')::boolean, true)
$$;
revoke all on function public.message_email_targets(uuid) from public, anon, authenticated;
grant execute on function public.message_email_targets(uuid) to service_role;
