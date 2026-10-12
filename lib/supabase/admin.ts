import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Préau avec la clé service_role : serveur uniquement, jamais exposé au navigateur.
 * Sert à confirmer les paiements (confirm_payment), après vérification chez Crédit Domestique,
 * et à lire ou écrire les fichiers du compartiment privé « documents », après vérification des droits.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
