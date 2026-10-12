"use client";

import { useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Counter } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Checkbox, RadioGroup, Switch } from "@/components/ui/choice";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Logo, LogoMark } from "@/components/ui/logo";
import { DistributionBar, Pastille, PastilleLegend } from "@/components/ui/pastille";
import { SegmentedControl } from "@/components/ui/segmented";
import { SubjectChip } from "@/components/ui/subject-chip";
import { ToastPreview, useToast } from "@/components/ui/toast";
import { distribution, type EvalValue } from "@/lib/evaluation";
import { ICON_NAMES } from "@/lib/icons";
import { SUBJECTS } from "@/lib/mock/subjects";
import { ABSENCE_REASONS } from "@/lib/mock/viesco";
import { subjectColor, SUBJECT_HUES } from "@/lib/subjects";
import { usePreferences } from "@/lib/use-preferences";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id={id} className="m-0 font-display text-[2rem] leading-tight font-bold tracking-[-0.03em]">
          {title}
        </h2>
        {intro && <p className="m-0 max-w-[42rem] text-ink-2">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Demo({ title, note, children, className }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <Card padding="none" className={"flex flex-col gap-5 p-6 sm:p-7 " + (className ?? "")}>
      <h3 className="m-0 font-display text-h3 font-bold">{title}</h3>
      {children}
      {note && <p className="m-0 text-caption text-ink-muted">{note}</p>}
    </Card>
  );
}

const SWATCHES: { token: string; label: string }[] = [
  { token: "--brand", label: "Tableau · brand" },
  { token: "--sidebar", label: "Barre latérale" },
  { token: "--brand-tint", label: "Tableau clair" },
  { token: "--accent", label: "Crayon · accent" },
  { token: "--bg", label: "Craie · bg" },
  { token: "--surface", label: "Surface" },
  { token: "--surface-2", label: "Surface 2" },
  { token: "--neutral-bg", label: "Neutre" },
  { token: "--line", label: "Ligne" },
  { token: "--line-strong", label: "Ligne forte" },
  { token: "--ink", label: "Ink" },
  { token: "--ink-2", label: "Ink 2" },
  { token: "--ink-muted", label: "Ink atténué" },
];

const SEMANTICS = [
  { fg: "--ok", bg: "--ok-bg", label: "Succès" },
  { fg: "--warn", bg: "--warn-bg", label: "Attention" },
  { fg: "--danger", bg: "--danger-bg", label: "Action requise" },
  { fg: "--info", bg: "--info-bg", label: "Info" },
  { fg: "--neutral", bg: "--neutral-tone-bg", label: "Neutre" },
];

const HUE_LABELS: Record<keyof typeof SUBJECT_HUES, string> = {
  arts: "Arts", francais: "Français", histoireGeo: "Histoire-Géo", sesPhilo: "SES / Philo", eps: "EPS", svt: "SVT",
  physiqueChimie: "Physique-Chimie", techno: "Technologie", maths: "Mathématiques", lv2: "Espagnol / LV2",
  anglais: "Anglais", musique: "Musique",
};

export function Showcase() {
  const toast = useToast();
  const [prefs, setPrefs] = usePreferences();
  const [period, setPeriod] = useState("t1");
  const [reason, setReason] = useState<string>();
  const [checked, setChecked] = useState(true);
  const sample: EvalValue[] = ["MI", "MF", "MF", "MS", "MS", "MS", "MS", "MS", "TB", "TB", "TB"];

  return (
    <div className="flex flex-col gap-20">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-label">Aperçu du thème</span>
        <SegmentedControl
          aria-label="Thème de l'aperçu"
          value={prefs.theme}
          onValueChange={(v) => setPrefs({ theme: v as typeof prefs.theme })}
          options={[
            { value: "system", label: "Système" },
            { value: "light", label: "Clair" },
            { value: "dark", label: "Sombre" },
          ]}
        />
        <Switch label="Sigles sur les pastilles" checked={prefs.sigles} onCheckedChange={(v) => setPrefs({ sigles: v })} />
      </Card>

      <Section id="ds-logo" title="Logo" intro="Carré Tableau, arche Craie. Favicon dès 16 px, logo complet dès 80 px. Zone de protection : la hauteur de l'arche.">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
          <Demo title="Logo complet">
            <Logo size={80} wordmarkSize={56} />
          </Demo>
          <Demo title="Inversé">
            <div className="flex w-fit items-center gap-4 rounded-card bg-sidebar p-6 text-sidebar-ink">
              <Logo size={48} wordmarkSize={32} inverse />
            </div>
          </Demo>
          <Demo title="Symbole">
            <div className="flex items-end gap-4">
              <LogoMark size={16} />
              <LogoMark size={32} />
              <LogoMark size={64} />
            </div>
          </Demo>
        </div>
      </Section>

      <Section id="ds-couleurs" title="Couleurs" intro="Jetons en variables CSS, redéfinis en mode sombre. L'accent Crayon sert au focus et aux compteurs, jamais au texte.">
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3 p-0">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
              <span className="h-16 border-b border-line" style={{ background: `var(${s.token})` }} />
              <span className="flex flex-col p-3">
                <b className="text-label">{s.label}</b>
                <code className="text-caption text-ink-muted">{s.token}</code>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {SEMANTICS.map((s) => (
            <span key={s.label} className="rounded-badge px-3 py-2 text-label font-bold" style={{ color: `var(${s.fg})`, background: `var(${s.bg})` }}>
              {s.label}
            </span>
          ))}
        </div>
        <Demo title="Matières" note="subjectColor(h) : pastille oklch(0.6 0.13 h), fond oklch(0.95 0.035 h), texte oklch(0.38 0.09 h) — oklch(0.8 0.1 h) en mode sombre.">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUBJECT_HUES) as (keyof typeof SUBJECT_HUES)[]).map((k) => (
              <SubjectChip key={k} name={`${HUE_LABELS[k]} · ${SUBJECT_HUES[k]}`} hue={SUBJECT_HUES[k]} dot />
            ))}
          </div>
          <code className="text-caption text-ink-muted">subjectColor(240).dot = {subjectColor(240).dot}</code>
        </Demo>
      </Section>

      <Section id="ds-typo" title="Typographie" intro="Schibsted Grotesk pour les titres, Atkinson Hyperlegible Next pour l'interface. 13 px minimum.">
        <Card className="flex flex-col gap-4">
          <span className="font-display text-display font-extrabold tracking-[-0.04em]">Display 56</span>
          <span className="font-display text-h1 font-bold tracking-[-0.025em]">Titre h1 · 32 / 36</span>
          <span className="font-display text-h2 font-bold tracking-[-0.01em]">Titre h2 · 20 / 26</span>
          <span className="text-body">Corps de texte · 16 / 25. Notes, devoirs, absences, messages.</span>
          <span className="text-label font-bold">Libellé · 14 / 20</span>
          <span className="text-caption text-ink-muted">Légende · 13 / 18 (minimum)</span>
          <span className="tabular text-body">Chiffres tabulaires : 08:30 · 10:15 · 23,40 €</span>
        </Card>
      </Section>

      <Section id="ds-icones" title="Icônes" intro="Material Symbols Rounded 400, contour. Remplissage uniquement pour la navigation active.">
        <Card>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2 p-0">
            {ICON_NAMES.map((n) => (
              <li key={n} className="flex items-center gap-2 rounded-[8px] p-2 text-caption text-ink-2">
                <Icon name={n} size={22} className="text-brand" />
                <code className="truncate">{n}</code>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section id="ds-composants" title="Composants">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,30rem),1fr))] gap-4">
          <Demo title="Boutons" note="Un seul bouton principal par zone. Libellé : verbe à l'infinitif.">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button icon="send">Envoyer</Button>
              <Button variant="secondary">Annuler</Button>
              <Button variant="tertiary">Voir tout</Button>
              <Button variant="danger">Supprimer</Button>
              <Button disabled>Désactivé</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button size="sm">Compact · 36</Button>
              <Button size="md">Défaut · 44</Button>
              <Button size="lg">Grand · 52</Button>
            </div>
          </Demo>

          <Demo title="Champs" note="Libellé toujours visible ; l'erreur dit quoi faire.">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))] gap-4">
              <TextField label="Objet du message" defaultValue="Absence de Léa jeudi" hint="Visible par le destinataire" />
              <SelectField
                label="Motif d'absence"
                placeholder="Choisir un motif"
                options={ABSENCE_REASONS}
                value={reason}
                onValueChange={setReason}
                error={reason ? undefined : "Indiquez un motif pour justifier."}
              />
            </div>
          </Demo>

          <Demo title="Case à cocher, radio, interrupteur">
            <div className="flex flex-wrap items-center gap-6">
              <Checkbox label={checked ? "Fait" : "À faire"} checked={checked} onCheckedChange={setChecked} />
              <Checkbox label="À faire" />
              <Switch label="Notifications" defaultChecked />
            </div>
            <RadioGroup
              label="Période"
              defaultValue="t1"
              options={[
                { value: "t1", label: "Trimestre 1" },
                { value: "t2", label: "Trimestre 2" },
                { value: "t3", label: "Trimestre 3" },
              ]}
            />
          </Demo>

          <Demo title="Badges et chips matière">
            <div className="flex flex-wrap gap-2">
              <Badge tone="ok">Justifiée</Badge>
              <Badge tone="danger">À justifier</Badge>
              <Badge tone="warn">Retard</Badge>
              <Badge tone="info">Cours déplacé</Badge>
              <Badge tone="neutral">Brouillon</Badge>
              <Badge tone="inverse">Contrôle</Badge>
              <Counter count={3} label="3 messages non lus" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SubjectChip name="Mathématiques" hue={SUBJECTS.ma.hue} dot />
              <SubjectChip name="Français" hue={SUBJECTS.fr.hue} dot />
              <SubjectChip name="SVT" hue={SUBJECTS.svt.hue} dot />
              <SubjectChip name="Anglais" hue={SUBJECTS.en.hue} />
            </div>
            <div className="flex items-center gap-3">
              <Avatar initials="MP" />
              <span className="text-label">Avatar à initiales, toujours accompagné du nom</span>
            </div>
          </Demo>

          <Demo title="Pastilles d'évaluation" note="16 px en liste · 20 px en saisie · 24 px en tableau · 28 px en détail. Jamais seule : libellé visible et aria-label.">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {(["MI", "MF", "MS", "TB", "NE", "ABS", "DISP"] as const).map((v) => (
                <Pastille key={v} value={v} display="short" />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {(["MI", "MF", "MS", "TB"] as const).map((v) => (
                <Pastille key={v} value={v} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-5">
              {([16, 20, 24, 28] as const).map((s) => (
                <Pastille key={s} value="MS" size={s} display="short" labelClassName="text-caption text-ink-muted" />
              ))}
            </div>
          </Demo>

          <Demo title="Contrôle segmenté">
            <SegmentedControl
              aria-label="Trimestre"
              value={period}
              onValueChange={setPeriod}
              options={[
                { value: "t1", label: "Trimestre 1" },
                { value: "t2", label: "Trimestre 2" },
                { value: "t3", label: "Trimestre 3" },
              ]}
            />
          </Demo>

          <Demo title="Alertes et toast">
            <Alert tone="info" title="Cours déplacé.">
              Physique-Chimie de jeudi a lieu en salle Labo 2.
            </Alert>
            <Alert
              tone="danger"
              title="1 absence à justifier"
              action={
                <Button size="sm" variant="danger">
                  Justifier
                </Button>
              }
            >
              depuis le jeu. 1 oct.
            </Alert>
            <div className="flex flex-wrap items-center gap-4">
              <ToastPreview title="Message envoyé" action={{ label: "Annuler" }} />
              <Button variant="secondary" size="sm" onClick={() => toast({ title: "Message envoyé", action: { label: "Annuler" } })}>
                Afficher un toast
              </Button>
            </div>
          </Demo>

          <Demo title="Carte" note="Aucune ombre : bordure --line, rayon 14.">
            <Card>
              <CardHeader title="Pour demain" action={<span className="text-caption text-ink-muted">1 / 3 faits</span>} />
              <p className="mt-3 mb-0 text-ui text-ink-2">Le contenu de la carte suit la grille d'espacement 4 · 8 · 12 · 16 · 24.</p>
            </Card>
          </Demo>
        </div>
      </Section>

      <Section id="ds-dataviz" title="Visualiser les évaluations" intro="Aucune moyenne, aucun classement : on montre la répartition des pastilles, dans l'ordre MI → TB.">
        <Demo title="Répartition par matière">
          <div className="grid grid-cols-[8rem_1fr] items-center gap-x-3.5 gap-y-3 text-label">
            <span>Français</span>
            <DistributionBar counts={distribution(sample)} height={14} />
            <span>Mathématiques</span>
            <DistributionBar counts={distribution(["MF", "MS", "MS", "MS", "TB", "TB", "TB", "TB", "TB", "TB"])} height={14} />
          </div>
          <PastilleLegend className="border-t border-line pt-3" size={10} />
        </Demo>
      </Section>
    </div>
  );
}
