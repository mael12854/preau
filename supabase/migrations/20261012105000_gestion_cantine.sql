-- Gestion de la cantine et des factures par le secrétariat ou la direction de l'école.
alter table public.schools add column if not exists canteen boolean not null default false;
alter table public.schools add column if not exists meal_price_cents integer not null default 450 check (meal_price_cents between 0 and 5000);

-- Historique des mouvements de solde faits à la main (espèces, remboursement, repas…).
create table if not exists public.canteen_adjustments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  amount_cents integer not null check (amount_cents <> 0),
  reason text not null check (char_length(reason) between 1 and 120),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.canteen_adjustments enable row level security;
create policy "mouvements de cantine : famille et gestion" on public.canteen_adjustments for select to authenticated
  using ((select private.is_family_of(student_id))
         or ((select private.my_kind()) in ('secretariat', 'direction') and (select private.can_see_student(student_id))));
revoke all on public.canteen_adjustments from anon;
revoke insert, update on public.canteen_adjustments from authenticated;

create or replace function private.manages_school()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.me() is not null and private.my_kind() in ('secretariat', 'direction')
$$;

create or replace function public.set_canteen_settings(p_enabled boolean, p_meal_price_cents integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.manages_school() then raise exception 'Réservé au secrétariat et à la direction' using errcode = '42501'; end if;
  if p_meal_price_cents is null or p_meal_price_cents not between 0 and 5000 then raise exception 'Prix du repas invalide.'; end if;
  update public.schools set canteen = coalesce(p_enabled, false), meal_price_cents = p_meal_price_cents where id = private.my_school();
  update public.canteen_accounts a set meal_price_cents = p_meal_price_cents
   where exists (select 1 from public.students s join public.classes c on c.id = s.class_id
                 where s.profile_id = a.student_id and c.school_id = private.my_school());
end $$;

-- Menu d'un jour : un plat par ligne ; liste vide = pas de menu ce jour-là.
create or replace function public.save_menu(p_day date, p_items text[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_items text[];
begin
  if not private.manages_school() then raise exception 'Réservé au secrétariat et à la direction' using errcode = '42501'; end if;
  if p_day is null then raise exception 'Indiquez le jour.'; end if;
  select coalesce(array_agg(left(trim(x), 80) order by n) filter (where trim(x) <> ''), '{}') into v_items
    from unnest(coalesce(p_items, '{}')) with ordinality u(x, n);
  if cardinality(v_items) > 8 then raise exception 'Huit plats au plus.'; end if;
  insert into public.menus (school_id, served_on, items) values (private.my_school(), p_day, v_items)
  on conflict (school_id, served_on) do update set items = excluded.items;
end $$;

-- Mouvement de solde (positif : crédit, ex. paiement en espèces ; négatif : débit, ex. repas).
create or replace function public.adjust_canteen_balance(p_student uuid, p_amount_cents integer, p_reason text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_balance integer;
begin
  if not private.manages_school() or not private.can_see_student(p_student) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  if coalesce(p_amount_cents, 0) = 0 then raise exception 'Indiquez un montant.'; end if;
  if abs(p_amount_cents) > 100000 then raise exception 'Montant trop élevé (1 000 € au plus).'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Indiquez le motif.'; end if;
  insert into public.canteen_accounts (student_id, balance_cents, meal_price_cents)
  values (p_student, 0, (select meal_price_cents from public.schools where id = private.my_school()))
  on conflict (student_id) do nothing;
  update public.canteen_accounts set balance_cents = balance_cents + p_amount_cents where student_id = p_student
  returning balance_cents into v_balance;
  insert into public.canteen_adjustments (student_id, amount_cents, reason, created_by)
  values (p_student, p_amount_cents, left(trim(p_reason), 120), private.me());
  return v_balance;
end $$;

-- Factures : une par élève (sortie, fournitures, cantine…). Retourne le nombre de factures créées.
create or replace function public.create_invoices(p_students uuid[], p_label text, p_amount_cents integer, p_due_on date)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
  if not private.manages_school() then raise exception 'Réservé au secrétariat et à la direction' using errcode = '42501'; end if;
  if coalesce(trim(p_label), '') = '' then raise exception 'Indiquez l''objet de la facture.'; end if;
  if coalesce(p_amount_cents, 0) <= 0 or p_amount_cents > 500000 then raise exception 'Montant invalide.'; end if;
  if p_due_on is null then raise exception 'Indiquez la date limite.'; end if;
  if exists (select 1 from unnest(coalesce(p_students, '{}')) s where not private.can_see_student(s)) then
    raise exception 'Élève introuvable' using errcode = '42501';
  end if;
  insert into public.invoices (student_id, label, amount_cents, status, due_on)
  select distinct s, left(trim(p_label), 120), p_amount_cents, 'a_payer'::public.invoice_status, p_due_on
    from unnest(p_students) s join public.students st on st.profile_id = s;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Choisissez au moins un élève.'; end if;
  return v_n;
end $$;

-- Facture réglée hors ligne (espèces, chèque…) ou annulée.
create or replace function public.settle_invoice(p_invoice uuid, p_method text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_student uuid;
begin
  select student_id into v_student from public.invoices where id = p_invoice;
  if v_student is null or not private.manages_school() or not private.can_see_student(v_student) then
    raise exception 'Facture introuvable' using errcode = '42501';
  end if;
  if p_method = 'annulee' then
    update public.invoices set status = 'creditee', paid_on = null, method = 'Annulée' where id = p_invoice;
  else
    if coalesce(trim(p_method), '') = '' then raise exception 'Indiquez le moyen de paiement.'; end if;
    update public.invoices set status = 'payee', paid_on = current_date, method = left(trim(p_method), 40)
     where id = p_invoice and status = 'a_payer';
    if not found then raise exception 'Cette facture n''est plus à payer.'; end if;
  end if;
end $$;

do $$ declare f text; begin
  foreach f in array array['set_canteen_settings(boolean, integer)', 'save_menu(date, text[])',
    'adjust_canteen_balance(uuid, integer, text)', 'create_invoices(uuid[], text, integer, date)', 'settle_invoice(uuid, text)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function private.manages_school() from public, anon;
