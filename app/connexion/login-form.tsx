"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="flex w-full max-w-[24rem] flex-col gap-4 rounded-card border border-line bg-surface p-6" noValidate>
      <h2 className="m-0 font-display text-h2 font-bold">Se connecter</h2>
      {state.error && <Alert tone="danger" title={state.error} />}
      <input type="hidden" name="suite" value={next ?? ""} />
      <TextField label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <TextField label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
