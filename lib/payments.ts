import "server-only";

/**
 * Point d'intégration du prestataire de paiement (Crédit Domestique).
 *
 * Parcours :
 * 1. La famille clique sur « Payer » ou « + 20 € » : l'application crée un paiement en attente
 *    (fonction SQL start_payment) puis appelle createCheckout.
 * 2. createCheckout ouvre une session chez le prestataire et renvoie l'adresse de la page de paiement.
 * 3. Le prestataire notifie le résultat (webhook) à une fonction côté serveur (Supabase Edge Function
 *    ou route API) qui appelle confirm_payment(id, 'reussi' | 'echoue', référence) avec la clé service_role.
 *    C'est seulement à ce moment que la facture est réglée ou le solde crédité.
 *
 * Tant que le prestataire n'est pas branché, createCheckout renvoie null : le paiement reste
 * « en attente de confirmation » et peut être annulé par la famille.
 */
export type CheckoutRequest = {
  paymentId: string;
  amountCents: number;
  label: string;
  /** Adresse où revenir après le paiement. */
  returnUrl: string;
};

export async function createCheckout(request: CheckoutRequest): Promise<string | null> {
  void request; // À brancher sur l'API Crédit Domestique.
  return null;
}
