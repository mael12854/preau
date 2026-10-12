"use client";

import { useState, useTransition } from "react";
import { postLiaisonNote, signLiaisonNote } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { LiaisonNoteView } from "@/lib/data/liaison";

type Mode = { kind: "famille"; studentId: string } | { kind: "enfant" } | { kind: "enseignant"; classes: { value: string; label: string }[] };

function Compose({ classes }: { classes: { value: string; label: string }[] }) {
  const toast = useToast();
  const [classId, setClassId] = useState(classes[0]?.value);
  const [sign, setSign] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (classes.length === 0) return null;
  return (
    <form
      aria-labelledby="ecrire-mot"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        if (!classId) return setError("Choisissez une classe.");
        start(async () => {
          const r = await postLiaisonNote(classId, String(f.get("titre")), String(f.get("mot")), sign);
          if (!r.ok) return setError(r.error);
          setError(undefined);
          form.reset();
          setSign(false);
          toast({ title: "Mot envoyé aux familles" });
        });
      }}
    >
      <h2 id="ecrire-mot" className="m-0 font-display text-h3 font-bold">
        Écrire un mot
      </h2>
      {classes.length > 1 && <SelectField label="Classe" options={classes} value={classId} onValueChange={setClassId} />}
      <TextField label="Titre" name="titre" required maxLength={200} placeholder="Sortie à la médiathèque" />
      <TextAreaField label="Mot aux familles" name="mot" required rows={4} />
      <Checkbox label="Demander une signature des parents" checked={sign} onCheckedChange={setSign} />
      {error && (
        <p role="alert" className="m-0 text-label text-danger">
          {error}
        </p>
      )}
      <Button type="submit" icon="send" className="self-start" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
    </form>
  );
}

/** Cahier de liaison : mots de l'enseignant, « Lu et signé » par les parents. */
export function LiaisonScreen({ notes, mode }: { notes: LiaisonNoteView[]; mode: Mode }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [signed, setSigned] = useState<string[]>([]);
  const big = mode.kind === "enfant";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-label="Mots du cahier de liaison" className="flex min-w-0 flex-col gap-3">
        {notes.length === 0 && (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucun mot dans le cahier de liaison.</p>
        )}
        {notes.map((n) => {
          const isSigned = n.signed || signed.includes(n.id);
          return (
            <article key={n.id} aria-labelledby={`mot-${n.id}`} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <h3 id={`mot-${n.id}`} className={big ? "m-0 font-display text-h2 font-bold" : "m-0 font-display text-h3 font-bold"}>
                    {n.title}
                  </h3>
                  <span className="text-caption text-ink-muted">
                    {[n.author, mode.kind === "enseignant" ? n.className : null, n.date].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {n.requiresSignature &&
                  (mode.kind === "enseignant" && n.signatures ? (
                    <Badge tone={n.signatures.signed >= n.signatures.total && n.signatures.total > 0 ? "ok" : "warn"}>
                      {n.signatures.signed} / {n.signatures.total} signés
                    </Badge>
                  ) : isSigned ? (
                    <Badge tone="ok">Signé</Badge>
                  ) : (
                    <Badge tone="danger">À signer</Badge>
                  ))}
              </div>
              <p className={big ? "m-0 text-h3 leading-relaxed whitespace-pre-line" : "m-0 text-lg leading-relaxed whitespace-pre-line"}>{n.body}</p>
              {mode.kind === "famille" && n.requiresSignature && !isSigned && (
                <Button
                  className="self-start"
                  icon="draw"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await signLiaisonNote(n.id, mode.studentId);
                      if (r.ok) setSigned((s) => [...s, n.id]);
                      toast({ title: r.ok ? "Mot signé" : r.error });
                    })
                  }
                >
                  Lu et signé
                </Button>
              )}
              {mode.kind === "enfant" && n.requiresSignature && !isSigned && (
                <p className="m-0 flex items-center gap-2 text-ui text-ink-2">
                  <Icon name="info" className="text-info" />
                  Montrez ce mot à vos parents pour qu&apos;ils le signent.
                </p>
              )}
            </article>
          );
        })}
      </section>
      {mode.kind === "enseignant" && <Compose classes={mode.classes} />}
    </div>
  );
}
