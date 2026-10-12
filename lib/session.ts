import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfileById, MODULES, type ModuleKey, type Profile } from "@/lib/mock/profiles";

export const PROFILE_COOKIE = "preau-profil";

/** Profil de démonstration courant (cookie), élève de collège par défaut. */
export async function getProfile(): Promise<Profile> {
  const store = await cookies();
  return getProfileById(store.get(PROFILE_COOKIE)?.value);
}

/** Renvoie le profil s'il a accès au module, sinon redirige vers le tableau de bord. */
export async function requireModule(key: ModuleKey): Promise<Profile> {
  const profile = await getProfile();
  if (!profile.nav.includes(key)) redirect(`/${MODULES.dash.slug}`);
  return profile;
}
