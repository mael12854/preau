-- Crédit Domestique : numéro de compte du responsable, pour lui adresser les demandes de paiement.
alter table public.profile_private add column if not exists credit_domestique_account text
  check (credit_domestique_account is null or length(credit_domestique_account) between 1 and 64);
grant update (credit_domestique_account) on public.profile_private to authenticated;
