import "server-only";
import * as cd from "@/lib/credit-domestique";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServer } from "@/lib/supabase/server";

/**
 * Paiements par Crédit Domestique.
 *
 * 1. « Payer » crée un paiement en attente dans Préau (start_payment), puis une demande de paiement
 *    (`charges`) chez Crédit Domestique, adressée au compte du responsable.
 * 2. Le responsable l'accepte ou la refuse dans Crédit Domestique.
 * 3. syncPayments relit ces demandes côté serveur et confirme dans Préau (confirm_payment, clé service_role) :
 *    acceptée → facture réglée ou solde cantine crédité ; refusée → paiement échoué.
 */

export type CheckoutRequest = { paymentId: string; amountCents: number; label: string; payerAccount: string | null };
export type CheckoutResult = { ok: true; message: string } | { ok: false; error: string };

export async function createCheckout(supabase: SupabaseServer, request: CheckoutRequest): Promise<CheckoutResult> {
  // Sans clé service_role, Préau ne pourrait pas confirmer : on ne crée pas de demande chez Crédit Domestique.
  if (!cd.isConfigured() || !createAdminClient()) {
    return { ok: true, message: "Paiement en attente : Crédit Domestique n'est pas encore configuré." };
  }
  if (!request.payerAccount) {
    return { ok: false, error: "Indiquez votre numéro de compte Crédit Domestique dans Mon compte pour payer." };
  }
  try {
    if (!(await cd.accountExists(request.payerAccount))) {
      return { ok: false, error: "Ce compte Crédit Domestique est introuvable. Vérifiez le numéro dans Mon compte." };
    }
    const ref = await cd.createCharge(request.paymentId, request.payerAccount, request.amountCents, `Préau · ${request.label}`);
    // La référence est enregistrée par le serveur (clé service_role) : l'utilisateur ne peut pas la modifier.
    await createAdminClient()?.from("payments").update({ provider_reference: ref }).eq("id", request.paymentId);
    return { ok: true, message: "Demande envoyée : acceptez-la dans Crédit Domestique." };
  } catch {
    // La demande n'a pas pu être créée : on annule le paiement en attente pour pouvoir réessayer.
    await supabase.rpc("cancel_payment", { p_payment: request.paymentId });
    return { ok: false, error: "Crédit Domestique ne répond pas. Réessayez dans un instant." };
  }
}

/** Relit chez Crédit Domestique les paiements en attente visibles par l'utilisateur et les confirme. */
export async function syncPayments(supabase: SupabaseServer): Promise<void> {
  const admin = createAdminClient();
  if (!admin || !cd.isConfigured()) return;
  const { data: pending } = await supabase
    .from("payments")
    .select("id, amount_cents, provider_reference")
    .eq("status", "en_attente")
    .not("provider_reference", "is", null);
  if (!pending?.length) return;

  let charges: Awaited<ReturnType<typeof cd.getCharges>>;
  try {
    charges = await cd.getCharges(pending.map((p) => p.provider_reference!));
  } catch {
    return; // Crédit Domestique indisponible : on réessaiera au prochain affichage.
  }
  const company = process.env.CREDIT_DOMESTIQUE_COMPANY_ACCOUNT;
  for (const p of pending) {
    const c = charges.get(p.provider_reference!);
    if (!c || c.status === "pending") continue;
    // On ne confirme que si la demande correspond bien (même entreprise, même montant).
    const matches = c.company === company && c.amount === cd.toProviderAmount(p.amount_cents);
    const status = c.status === "accepted" && matches ? "reussi" : "echoue";
    await admin.rpc("confirm_payment", { p_payment: p.id, p_status: status, p_reference: p.provider_reference! });
  }
}
