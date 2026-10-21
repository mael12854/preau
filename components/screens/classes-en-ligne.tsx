"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeClassLink, saveClassLink } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { ClassLink, LinkKind, OnlineClass } from "@/lib/data/online";
import type { IconName } from "@/lib/icons";

const KINDS: { value: LinkKind; label: string; name: string; icon: IconName; urlHint: string; codeLabel: string }[] = [
  { value: "meet", label: "Google Meet", name: "Classe virtuelle", icon: "cast_for_education", urlHint: "https://meet.google.com/abc-defg-hij", codeLabel: "Code de la réunion (facultatif)" },
  { value: "kahoot", label: "Kahoot!", name: "Kahoot", icon: "apps", urlHint: "https://kahoot.it", codeLabel: "Code PIN" },
  { value: "duolingo", label: "Duolingo", name: "Classe Duolingo", icon: "apps", urlHint: "https://www.duolingo.com/classroom/…", codeLabel: "Code de classe" },
  { value: "autre", label: "Autre", name: "", icon: "link", urlHint: "https://…", codeLabel: "Code (facultatif)" },
];
const kindOf = (k: LinkKind) => KINDS.find((x) => x.value === k)!;

/** Copier un code, avec un retour pour les lecteurs d'écran. */
function CopyCode({ code }: { code: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(
          () => toast({ title: `Code ${code} copié` }),
          () => toast({ title: "La copie n'a pas abouti : sélectionnez le code à la main." }),
        );
      }}
      aria-label={`Copier le code ${code}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface-2 px-2.5 font-mono text-ui font-bold tracking-wide hover:border-line-strong"
    >
      {code}
      <Icon name="content_copy" size={18} className="text-ink-muted" />
    </button>
  );
}

function LinkDialog({ classId, link, trigger }: { classId: string; link?: ClassLink; trigger: React.ReactNode }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LinkKind>(link?.kind ?? "meet");
  const [label, setLabel] = useState(link?.label ?? KINDS[0].name);
  const [url, setUrl] = useState(link?.url ?? "");
  const [code, setCode] = useState(link?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const k = kindOf(kind);
  return (
    <Dialog open={open} onOpenChange={setOpen} title={link ? "Modifier le lien" : "Ajouter un lien"} trigger={trigger}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return setError("Donnez un nom au lien.");
          if (!url.trim() && !code.trim()) return setError("Indiquez un lien ou un code.");
          if (url.trim() && !url.trim().startsWith("https://")) return setError("Le lien doit commencer par https://");
          setError(null);
          start(async () => {
            const r = await saveClassLink({ id: link?.id ?? null, classId, kind, label: label.trim(), url: url.trim(), code: code.trim() });
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: link ? "Lien modifié" : "Lien ajouté" });
            setOpen(false);
            if (!link) {
              setUrl("");
              setCode("");
            }
            router.refresh();
          });
        }}
      >
        <SelectField
          label="Type"
          options={KINDS.map((x) => ({ value: x.value, label: x.label }))}
          value={kind}
          onValueChange={(v) => {
            const next = v as LinkKind;
            if (!label.trim() || KINDS.some((x) => x.name === label)) setLabel(kindOf(next).name);
            setKind(next);
          }}
        />
        <TextField label="Nom" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} required />
        <TextField label="Lien" type="url" inputMode="url" placeholder={k.urlHint} value={url} onChange={(e) => setUrl(e.target.value)} />
        <TextField label={k.codeLabel} value={code} maxLength={80} onChange={(e) => setCode(e.target.value)} />
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function LinkRow({ link, classId, editable }: { link: ClassLink; classId: string; editable: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const k = kindOf(link.kind);
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
      <Icon name={k.icon} size={22} className="text-brand" />
      <div className="flex min-w-0 flex-1 flex-col">
        <b className="text-ui">{link.label}</b>
        <span className="text-caption text-ink-muted">{k.label}</span>
      </div>
      {link.code && <CopyCode code={link.code} />}
      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-control bg-brand px-4 text-label font-bold text-on-brand hover:opacity-90"
        >
          {link.kind === "meet" ? "Rejoindre" : "Ouvrir"}
          <Icon name="open_in_new" size={18} />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      )}
      {editable && (
        <span className="flex gap-1">
          <LinkDialog
            classId={classId}
            link={link}
            trigger={
              <button type="button" aria-label={`Modifier ${link.label}`} className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg">
                <Icon name="edit" size={20} />
              </button>
            }
          />
          <button
            type="button"
            disabled={pending}
            aria-label={`Retirer ${link.label}`}
            className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
            onClick={() => {
              if (!window.confirm(`Retirer « ${link.label} » ?`)) return;
              start(async () => {
                const r = await removeClassLink(link.id);
                toast({ title: r.ok ? "Lien retiré" : r.error });
                if (r.ok) router.refresh();
              });
            }}
          >
            <Icon name="delete" size={20} />
          </button>
        </span>
      )}
    </li>
  );
}

/** Mes classes en ligne : Meet, Kahoot, Duolingo… de chaque classe. Les professeurs de la classe les tiennent à jour. */
export function ClassesEnLigneScreen({ classes }: { classes: OnlineClass[] }) {
  if (!classes.length)
    return (
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
        Aucune classe pour l&apos;instant.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      {classes.map((c) => (
        <section key={c.id} aria-labelledby={`classe-${c.id}`} className="overflow-hidden rounded-card border border-line bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3">
            <h2 id={`classe-${c.id}`} className="m-0 font-display text-ui font-bold">
              {c.name}
            </h2>
            {c.editable && (
              <LinkDialog
                classId={c.id}
                trigger={
                  <Button icon="add" variant="secondary" className="h-9 px-3 text-label">
                    Ajouter un lien
                  </Button>
                }
              />
            )}
          </header>
          {c.links.length ? (
            <ul className="m-0 list-none p-0">
              {c.links.map((l) => (
                <LinkRow key={l.id} link={l} classId={c.id} editable={c.editable} />
              ))}
            </ul>
          ) : (
            <p className="m-0 px-5 py-4 text-label text-ink-2">
              {c.editable ? "Aucun lien : ajoutez le Meet, le code Duolingo ou le Kahoot de la classe." : "Aucun lien pour l'instant."}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
