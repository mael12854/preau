"use client";

import { useActionState, useRef } from "react";
import { signIn, type SignInState } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

/** Comptes de démonstration (voir supabase/seed.sql). */
const DEMO = [
  { label: "Élève · collège", name: "Léa Martin", initials: "LM", email: "lea.martin@jean-moulin.example" },
  { label: "Élève · lycée", name: "Hugo Benali", initials: "HB", email: "hugo.benali@jean-moulin.example" },
  { label: "Parent", name: "Sophie Martin", initials: "SM", email: "sophie.martin@famille.example" },
  { label: "Professeur", name: "Marc Durand", initials: "MD", email: "marc.durand@jean-moulin.example" },
  { label: "Vie scolaire / CPE", name: "Nadia Kader", initials: "NK", email: "nadia.kader@jean-moulin.example" },
  { label: "Direction", name: "Paul Lefèvre", initials: "PL", email: "principal@jean-moulin.example" },
  { label: "Secrétariat", name: "Claire Roux", initials: "CR", email: "secretariat@jean-moulin.example" },
];
const DEMO_PASSWORD = "preau-demo-2026";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <form action={action} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6" noValidate>
        <h2 className="m-0 font-display text-h2 font-bold">Se connecter</h2>
        {state.error && <Alert tone="danger" title={state.error} />}
        <input type="hidden" name="suite" value={next ?? ""} />
        <TextField ref={email} label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
        <TextField ref={password} label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <section aria-labelledby="demo-title" className="flex flex-col gap-3">
        <h2 id="demo-title" className="m-0 font-display text-h3 font-bold">
          Comptes de démonstration
        </h2>
        <p className="m-0 text-label text-ink-2">
          Choisissez un profil pour remplir le formulaire (mot de passe : <code>{DEMO_PASSWORD}</code>).
        </p>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-2 p-0">
          {DEMO.map((d) => (
            <li key={d.email}>
              <button
                type="button"
                onClick={() => {
                  if (email.current) email.current.value = d.email;
                  if (password.current) password.current.value = DEMO_PASSWORD;
                  password.current?.form?.querySelector<HTMLButtonElement>("button[type=submit]")?.focus();
                }}
                className="flex w-full items-center gap-3 rounded-control border-[1.5px] border-line bg-surface p-3 text-left hover:border-brand"
              >
                <Avatar initials={d.initials} size={36} />
                <span className="flex min-w-0 flex-col">
                  <b className="text-label">{d.label}</b>
                  <span className="truncate text-caption text-ink-muted">{d.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
