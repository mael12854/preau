import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cookie de la fiche active, pour un compte à plusieurs rôles (élève et parent…).
 * Transmis à la base dans l'en-tête « x-preau-profile » : la base vérifie qu'il s'agit d'une fiche du compte.
 */
export const PROFILE_COOKIE = "preau-profil";

/** Valeur du cookie de fiche pour l'espace « Général » (toutes les fiches d'enseignant du compte). */
export const GENERAL_SPACE = "general";

/**
 * Espace « Général » : fiche au nom de laquelle agir, posée par la section de la page où l'on clique.
 * La base vérifie de toute façon qu'elle appartient au compte (sinon : fiche principale).
 */
export const ACT_AS_COOKIE = "preau-agir";

/**
 * Client Supabase côté serveur : agit avec la session de l'utilisateur (la RLS s'applique).
 * `asProfile` : agir au nom d'une fiche précise du compte (espace « Général »).
 */
export async function createClient(asProfile?: string) {
  const store = await cookies();
  const cookie = store.get(PROFILE_COOKIE)?.value;
  const active =
    asProfile ??
    (cookie === GENERAL_SPACE ? store.get(ACT_AS_COOKIE)?.value : cookie);
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
