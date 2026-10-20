-- Retrouver un compte par son adresse e-mail : réservé au serveur (clé service_role), pour rattacher
-- une nouvelle fiche à un compte qui existe déjà (comptes à plusieurs rôles).
create or replace function public.account_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1
$$;
revoke all on function public.account_id_by_email(text) from public, anon, authenticated;
grant execute on function public.account_id_by_email(text) to service_role;
