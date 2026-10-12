-- Paiements réels (prestataire : Crédit Domestique)
-- 1. La famille crée un paiement « en attente » (start_payment).
-- 2. Le prestataire confirme côté serveur (webhook → Edge Function avec la clé service_role)
--    en appelant confirm_payment : c'est seulement là que la facture est réglée ou le solde crédité.
-- Les anciennes fonctions simulées (pay_invoice, top_up_canteen) ne sont plus appelables : elles créditaient sans paiement.

revoke all on function public.pay_invoice(uuid) from public, anon, authenticated;
revoke all on function public.top_up_canteen(uuid, integer) from public, anon, authenticated;

create type public.payment_kind as enum ('facture', 'recharge_cantine');
create type public.payment_status as enum ('en_attente', 'reussi', 'echoue', 'annule');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  kind public.payment_kind not null,
  student_id uuid not null references public.students (profile_id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  status public.payment_status not null default 'en_attente',
  provider text not null default 'credit_domestique',
  provider_reference text unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  check ((kind = 'facture') = (invoice_id is not null))
);
create index on public.payments (student_id, created_at desc);
-- Un seul paiement en attente par facture.
create unique index payments_one_pending_per_invoice on public.payments (invoice_id) where status = 'en_attente';

alter table public.payments enable row level security;
revoke all on public.payments from anon;
revoke insert, update, delete, truncate on public.payments from authenticated;
grant select on public.payments to authenticated;

create policy "paiements : famille, secrétariat, direction" on public.payments for select to authenticated
  using ((select private.is_family_of(student_id))
      or ((select private.my_kind()) in ('secretariat', 'direction') and (select private.can_see_student(student_id))));

-- Créer un paiement en attente (responsable légal uniquement). Renvoie l'identifiant à transmettre au prestataire.
create or replace function public.start_payment(p_kind public.payment_kind, p_student uuid, p_invoice uuid default null, p_amount_cents integer default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_amount integer;
  v_id uuid;
begin
  if not exists (select 1 from public.guardians where guardian_id = private.me() and student_id = p_student) then
    raise exception 'Seul un responsable peut payer pour cet élève' using errcode = '42501';
  end if;
  if p_kind = 'facture' then
    select amount_cents into v_amount from public.invoices
     where id = p_invoice and student_id = p_student and status = 'a_payer';
    if v_amount is null then raise exception 'Facture introuvable ou déjà réglée'; end if;
    if exists (select 1 from public.payments where invoice_id = p_invoice and status = 'en_attente') then
      raise exception 'Un paiement est déjà en cours pour cette facture.';
    end if;
  else
    if p_amount_cents is null or p_amount_cents not between 500 and 20000 then raise exception 'Montant non autorisé'; end if;
    v_amount := p_amount_cents;
    p_invoice := null;
  end if;
  insert into public.payments (kind, student_id, invoice_id, amount_cents, created_by)
  values (p_kind, p_student, p_invoice, v_amount, private.me()) returning id into v_id;
  return v_id;
end $$;

-- Confirmation par le prestataire : réservée au serveur (clé service_role), jamais au navigateur.
-- Idempotente : un paiement déjà traité n'est pas modifié.
create or replace function public.confirm_payment(p_payment uuid, p_status public.payment_status, p_reference text default null)
returns public.payment_status language plpgsql security definer set search_path = '' as $$
declare v_p public.payments;
begin
  if p_status = 'en_attente' then raise exception 'Statut final attendu'; end if;
  select * into v_p from public.payments where id = p_payment for update;
  if v_p.id is null then raise exception 'Paiement introuvable'; end if;
  if v_p.status <> 'en_attente' then return v_p.status; end if;

  update public.payments
     set status = p_status, provider_reference = coalesce(p_reference, provider_reference), confirmed_at = now()
   where id = p_payment;

  if p_status = 'reussi' then
    if v_p.kind = 'facture' then
      update public.invoices set status = 'payee', paid_on = current_date, method = 'Crédit Domestique' where id = v_p.invoice_id;
    else
      insert into public.canteen_accounts (student_id, balance_cents) values (v_p.student_id, 0) on conflict do nothing;
      update public.canteen_accounts set balance_cents = balance_cents + v_p.amount_cents where student_id = v_p.student_id;
      insert into public.invoices (student_id, label, amount_cents, status, paid_on, method)
      values (v_p.student_id, 'Rechargement cantine', v_p.amount_cents, 'creditee', current_date, 'Crédit Domestique');
    end if;
  end if;
  return p_status;
end $$;

-- La famille peut annuler un paiement qu'elle a lancé tant qu'il est en attente.
create or replace function public.cancel_payment(p_payment uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.payments set status = 'annule', confirmed_at = now()
   where id = p_payment and status = 'en_attente' and created_by = private.me();
  if not found then raise exception 'Paiement introuvable ou déjà traité'; end if;
end $$;

revoke all on function public.start_payment(public.payment_kind, uuid, uuid, integer) from public, anon;
revoke all on function public.confirm_payment(uuid, public.payment_status, text) from public, anon, authenticated;
revoke all on function public.cancel_payment(uuid) from public, anon;
grant execute on function public.start_payment(public.payment_kind, uuid, uuid, integer) to authenticated;
grant execute on function public.cancel_payment(uuid) to authenticated;
grant execute on function public.confirm_payment(uuid, public.payment_status, text) to service_role;
