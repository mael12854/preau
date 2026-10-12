import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Préau avec la clé service_role : serveur uniquement, jamais exposé au navigateur.
 * Sert seulement à confirmer les paiements (confirm_payment), après vérification chez Crédit Domestique.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
