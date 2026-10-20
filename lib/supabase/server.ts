import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cookie de la fiche active, pour un compte à plusieurs rôles (élève et parent…).
 * Transmis à la base dans l'en-tête « x-preau-profile » : la base vérifie qu'il s'agit d'une fiche du compte.
 */
export const PROFILE_COOKIE = "preau-profil";

/** Client Supabase côté serveur : agit avec la session de l'utilisateur (la RLS s'applique). */
export async function createClient() {
  const store = await cookies();
  const active = store.get(PROFILE_COOKIE)?.value;
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: active ? { headers: { "x-preau-profile": active } } : undefined,
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options),
            );
          } catch {
            // Appelé depuis un composant serveur : le proxy se charge de rafraîchir la session.
          }
        },
      },
    },
  );
}

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
