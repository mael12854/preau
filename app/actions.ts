"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

/** Connexion par adresse e-mail et mot de passe. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Indiquez votre adresse e-mail et votre mot de passe.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      email,
      error: error.status === 400 ? "Adresse e-mail ou mot de passe incorrect." : "Le serveur ne répond pas. Réessayez dans un instant.",
    };
  }
  const next = String(formData.get("suite") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/accueil");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
