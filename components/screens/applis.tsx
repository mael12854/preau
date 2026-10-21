"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCustomApp, saveAppLogin, updateCustomApp } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { MyApp } from "@/lib/data/online";

/** Identifiant de l'appli : retenu pour soi seul, copiable. Jamais de mot de passe. */
function LoginField({ app }: { app: MyApp }) {
  const toast = useToast();
  const [value, setValue] = useState(app.login);
  const [saved, setSaved] = useState(app.login);
  const [, start] = useTransition();
  const id = `login-${app.key}`;
  const save = () => {
    if (value.trim() === saved.trim()) return;
    start(async () => {
      const r = app.custom ? await updateCustomApp(app.key, { login: value }) : await saveAppLogin(app.key, value);
      if (!r.ok) return toast({ title: r.error });
      setSaved(value);
      toast({ title: value.trim() ? `Identifiant ${app.name} enregistré` : `Identifiant ${app.name} effacé` });
    });
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-caption text-ink-muted">
        Mon identifiant · {app.loginHint}
      </label>
      <div className="flex gap-1.5">
        <input
          id={id}
          value={value}
          maxLength={120}
          autoComplete="off"
          placeholder="Non renseigné"
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), save())}
          className="h-10 min-w-0 flex-1 rounded-control border border-line bg-surface px-2.5 text-label"
        />
        {saved.trim() && (
          <button
            type="button"
            aria-label={`Copier l'identifiant ${app.name}`}
            onClick={() =>
              navigator.clipboard?.writeText(saved).then(
                () => toast({ title: "Identifiant copié" }),
                () => toast({ title: "La copie n'a pas abouti." }),
              )
            }
            className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line text-ink-2 hover:border-line-strong"
          >
            <Icon name="content_copy" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function AppCard({ app }: { app: MyApp }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const hide = () =>
    start(async () => {
      const r = app.custom ? await updateCustomApp(app.key, { hidden: true }) : await saveAppLogin(app.key, app.login, true);
      toast({ title: r.ok ? `${app.name} retirée de vos applis` : r.error });
      if (r.ok) router.refresh();
    });
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="m-0 font-display text-ui font-bold">{app.name}</h3>
          <p className="m-0 text-caption leading-[1.4] text-ink-2">{app.description}</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={hide}
          aria-label={`Retirer ${app.name} de mes applis`}
          className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-neutral-bg"
        >
          <Icon name="visibility_off" size={18} />
        </button>
      </div>
      {app.sso && <Badge tone="info">Connexion avec {app.sso}</Badge>}
      <LoginField app={app} />
      <div className="mt-auto flex flex-wrap gap-2">
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-control bg-brand px-4 text-label font-bold text-on-brand hover:opacity-90"
        >
          Ouvrir
          <Icon name="open_in_new" size={18} />
          <span className="sr-only">{app.name} (nouvel onglet)</span>
        </a>
        {app.loginUrl && (
          <a
            href={app.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-control border border-line px-3.5 text-label font-bold text-ink hover:border-line-strong"
          >
            Se connecter
            <span className="sr-only"> à {app.name} (nouvel onglet)</span>
          </a>
        )}
      </div>
    </li>
  );
}

function AddApp() {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [login, setLogin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Ajouter une appli"
      description="Elle n'apparaît que pour vous."
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Ajouter une appli
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await addCustomApp(name, url, login);
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: `${name.trim()} ajoutée` });
            setOpen(false);
            setName("");
            setUrl("https://");
            setLogin("");
            setError(null);
            router.refresh();
          });
        }}
      >
        <TextField label="Nom" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
        <TextField label="Lien" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <TextField label="Mon identifiant (facultatif)" hint="Pas de mot de passe : votre navigateur peut le retenir." value={login} maxLength={120} onChange={(e) => setLogin(e.target.value)} />
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Mes applis : outils pédagogiques, identifiant retenu pour chacun (pour soi seul), applis ajoutées. */
export function ApplisScreen({ apps }: { apps: MyApp[] }) {
  const toast = useToast();
  const router = useRouter();
  const [, start] = useTransition();
  const visible = apps.filter((a) => !a.hidden);
  const hidden = apps.filter((a) => a.hidden);
  const groups = [...new Set(visible.map((a) => a.category))];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-5 py-4">
        <p className="m-0 max-w-2xl text-label leading-[1.45] text-ink-2">
          Préau retient votre identifiant pour chaque appli, jamais votre mot de passe. Laissez votre navigateur
          retenir le mot de passe, ou utilisez « Connexion avec Google » quand l&apos;appli le propose : vous resterez
          connecté.
        </p>
        <AddApp />
      </div>
      {groups.map((g) => (
        <section key={g} aria-labelledby={`cat-${g}`} className="flex flex-col gap-3">
          <h2 id={`cat-${g}`} className="m-0 font-display text-h3 font-bold">
            {g}
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {visible
              .filter((a) => a.category === g)
              .map((a) => (
                <AppCard key={a.key} app={a} />
              ))}
          </ul>
        </section>
      ))}
      {hidden.length > 0 && (
        <details className="rounded-card border border-line bg-surface px-5 py-3">
          <summary className="cursor-pointer text-label font-bold">Applis retirées ({hidden.length})</summary>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
            {hidden.map((a) => (
              <li key={a.key}>
                <Button
                  variant="secondary"
                  className="h-9 px-3 text-label"
                  onClick={() =>
                    start(async () => {
                      const r = a.custom ? await updateCustomApp(a.key, { hidden: false }) : await saveAppLogin(a.key, a.login, false);
                      if (!r.ok) return toast({ title: r.error });
                      router.refresh();
                    })
                  }
                >
                  Remettre {a.name}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
