"use client";

import { useState, useTransition } from "react";
import { updateNotifications, updatePhone } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/choice";
import { TextField } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import type { TextSize } from "@/lib/preferences";
import { useEffectiveDark, usePreferences } from "@/lib/use-preferences";

const NOTIFICATIONS = [
  { key: "evaluations", label: "Nouvelles évaluations" },
  { key: "devoirs", label: "Devoirs ajoutés ou modifiés" },
  { key: "messages", label: "Messages reçus" },
  { key: "absences", label: "Absences et retards" },
] as const;

type Account = { name: string; email: string; phone: string; notifications: Record<string, boolean> };

function Panel({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1 rounded-card border border-line bg-surface p-[1.375rem]">
      <h2 id={id} className="m-0 mb-2 font-display text-h3 font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Mon compte : profil, notifications et affichage, double authentification. */
export function CompteScreen({ account }: { account: Account }) {
  const toast = useToast();
  const [prefs, setPrefs] = usePreferences();
  const dark = useEffectiveDark(prefs);
  const [notif, setNotif] = useState(account.notifications);
  const [phone, setPhone] = useState(account.phone);
  const [phoneError, setPhoneError] = useState<string>();
  const [, start] = useTransition();

  const toggleNotif = (key: string, value: boolean) => {
    const next = { ...notif, [key]: value };
    setNotif(next);
    start(async () => {
      const r = await updateNotifications(next);
      if (!r.ok) {
        setNotif(notif);
        toast({ title: r.error });
      }
    });
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section aria-labelledby="profil" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-[1.375rem]">
        <h2 id="profil" className="m-0 font-display text-h3 font-bold">
          Profil
        </h2>
        <TextField label="Nom" value={account.name} readOnly hint="Modifiable par le secrétariat uniquement" />
        <TextField label="Adresse e-mail" type="email" value={account.email} readOnly hint="Adresse de connexion, modifiable par le secrétariat" />
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updatePhone(phone);
              setPhoneError(r.ok ? undefined : r.error);
              if (r.ok) toast({ title: "Téléphone enregistré" });
            });
          }}
        >
          <TextField label="Téléphone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={phoneError} />
          <Button type="submit" variant="secondary" size="sm" className="self-start" disabled={phone === account.phone}>
            Enregistrer
          </Button>
        </form>
      </section>

      <div className="flex flex-col gap-5">
        <Panel id="notifications" title="Notifications et affichage">
          {NOTIFICATIONS.map((n) => (
            <Switch key={n.key} row label={n.label} checked={notif[n.key] ?? true} onCheckedChange={(v) => toggleNotif(n.key, v)} />
          ))}
          <Switch
            row
            label="Mode sombre"
            description={prefs.theme === "system" ? "Suit le réglage de votre appareil" : undefined}
            checked={dark}
            onCheckedChange={(v) => setPrefs({ theme: v ? "dark" : "light" })}
          />
          {prefs.theme !== "system" && (
            <Button variant="tertiary" size="sm" className="-ml-3.5 self-start" onClick={() => setPrefs({ theme: "system" })}>
              Suivre le réglage de l&apos;appareil
            </Button>
          )}
          <Switch
            row
            label="Sigles sur les pastilles"
            description="Affiche MI, MF, MS, TB dans chaque pastille"
            checked={prefs.sigles}
            onCheckedChange={(v) => setPrefs({ sigles: v })}
          />
        </Panel>

        <Panel id="lisibilite" title="Lisibilité">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-2.5">
            <span id="taille-texte" className="text-ui">
              Taille du texte
            </span>
            <SegmentedControl
              aria-label="Taille du texte"
              value={prefs.textSize}
              onValueChange={(v) => setPrefs({ textSize: v as TextSize })}
              options={[
                { value: "100", label: "100 %" },
                { value: "115", label: "115 %" },
                { value: "130", label: "130 %" },
              ]}
            />
          </div>
          <Switch row label="Contraste renforcé" checked={prefs.contrast} onCheckedChange={(v) => setPrefs({ contrast: v })} />
        </Panel>

        <section aria-labelledby="double-auth" className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-[1.375rem]">
          <div>
            <h2 id="double-auth" className="m-0 text-md font-bold">
              Double authentification
            </h2>
            <p className="m-0 text-sm text-ink-muted">Code envoyé par SMS à chaque connexion</p>
          </div>
          <Badge tone="ok">Activée</Badge>
        </section>
      </div>
    </div>
  );
}
