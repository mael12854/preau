"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PROFILES } from "@/lib/mock/profiles";
import { PROFILE_COOKIE } from "@/lib/session";

/** Change le profil de démonstration et ouvre son tableau de bord. */
export async function chooseProfile(formData: FormData) {
  const id = String(formData.get("profil"));
  if (PROFILES.some((p) => p.id === id)) {
    const store = await cookies();
    store.set(PROFILE_COOKIE, id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  }
  redirect("/accueil");
}
