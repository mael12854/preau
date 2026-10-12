"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/choice";
import { TextField } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/segmented";
import type { Profile } from "@/lib/mock";
import type { TextSize } from "@/lib/preferences";
import { useEffectiveDark, usePreferences } from "@/lib/use-preferences";

const NOTIFICATIONS = ["Nouvelles évaluations", "Devoirs ajoutés ou modifiés", "Messages reçus", "Absences et retards"];

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
export function CompteScreen({ profile }: { profile: Profile }) {
  const [prefs, setPrefs] = usePreferences();
  const dark = useEffectiveDark(prefs);
  const [notif, setNotif] = useState([true, true, true, true]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section aria-labelledby="profil" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-[1.375rem]">
        <h2 id="profil" className="m-0 font-display text-h3 font-bold">
          Profil
        </h2>
        <TextField label="Nom" value={profile.name} readOnly hint="Modifiable par le secrétariat uniquement" />
        <TextField label="Adresse e-mail" type="email" autoComplete="email" defaultValue={profile.email} />
        <TextField label="Téléphone" type="tel" autoComplete="tel" defaultValue="06 12 34 56 78" />
      </section>

      <div className="flex flex-col gap-5">
        <Panel id="notifications" title="Notifications et affichage">
          {NOTIFICATIONS.map((l, i) => (
            <Switch key={l} row label={l} checked={notif[i]} onCheckedChange={(v) => setNotif((n) => n.map((x, j) => (j === i ? v : x)))} />
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
