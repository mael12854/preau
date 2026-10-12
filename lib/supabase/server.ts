import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** Client Supabase côté serveur : agit avec la session de l'utilisateur (la RLS s'applique). */
export async function createClient() {
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Appelé depuis un composant serveur : le proxy se charge de rafraîchir la session.
          }
        },
      },
    },
  );
}

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
