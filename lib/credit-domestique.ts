import "server-only";

/**
 * Accès à Crédit Domestique (projet Supabase « Credit-Domestique »), côté serveur uniquement.
 * Une demande de paiement est une ligne de `charges` : Préau (compte entreprise) demande un montant
 * au responsable (payeur), qui l'accepte ou la refuse dans Crédit Domestique (respond_charge).
 *
 * Variables d'environnement :
 * - CREDIT_DOMESTIQUE_URL               URL du projet Supabase Crédit Domestique
 * - CREDIT_DOMESTIQUE_KEY               clé d'API de ce projet
 * - CREDIT_DOMESTIQUE_COMPANY_ACCOUNT   identifiant du compte entreprise de Préau
 * - CREDIT_DOMESTIQUE_UNIT              « cents » (défaut) ou « euros » : unité des soldes
 */

export type ChargeStatus = "pending" | "accepted" | "refused";

function config() {
  const url = process.env.CREDIT_DOMESTIQUE_URL;
  const key = process.env.CREDIT_DOMESTIQUE_KEY;
  const company = process.env.CREDIT_DOMESTIQUE_COMPANY_ACCOUNT;
  if (!url || !key || !company) return null;
  return { url: url.replace(/\/$/, ""), key, company, unit: process.env.CREDIT_DOMESTIQUE_UNIT === "euros" ? "euros" : "cents" };
}

export function isConfigured() {
  return config() !== null;
}

async function rest(path: string, init: RequestInit = {}) {
  const c = config()!;
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`Crédit Domestique : ${res.status}`);
  return res.status === 204 ? null : res.json();
}

/** Montant Préau (centimes) → unité de Crédit Domestique. */
function toProviderAmount(cents: number) {
  return config()!.unit === "euros" ? Math.round(cents / 100) : cents;
}

/** Vérifie que le compte du payeur existe et est actif. */
export async function accountExists(accountId: string): Promise<boolean> {
  const rows = (await rest(`accounts?id=eq.${encodeURIComponent(accountId)}&archived=eq.false&select=id`)) as { id: string }[];
  return rows.length === 1;
}

/** Crée la demande de paiement. L'identifiant est celui du paiement Préau (préfixé), pour retrouver l'un par l'autre. */
export async function createCharge(paymentId: string, payerAccount: string, amountCents: number, reason: string): Promise<string> {
  const c = config()!;
  const id = `preau-${paymentId}`;
  await rest("charges", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ id, company_id: c.company, payer_id: payerAccount, amount: toProviderAmount(amountCents), reason, status: "pending" }),
  });
  return id;
}

/** Statut des demandes de paiement, par identifiant. */
export async function getCharges(ids: string[]): Promise<Map<string, { status: ChargeStatus; amount: number; company: string }>> {
  const out = new Map<string, { status: ChargeStatus; amount: number; company: string }>();
  if (ids.length === 0) return out;
  const list = ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",");
  const rows = (await rest(`charges?id=in.(${encodeURIComponent(list)})&select=id,status,amount,company_id`)) as {
    id: string; status: ChargeStatus; amount: number; company_id: string;
  }[];
  rows.forEach((r) => out.set(r.id, { status: r.status, amount: r.amount, company: r.company_id }));
  return out;
}

export { toProviderAmount };
