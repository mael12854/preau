"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addAgendaEvent,
  deleteAgendaEvent,
  type AgendaInput,
} from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { AgendaEventView } from "@/lib/data/types";
import type { PublishTargets } from "@/lib/data/targets";
import { formatDateShort } from "@/lib/format";

const TONES: { value: AgendaInput["tone"]; label: string }[] = [
  { value: "neutral", label: "Gris" },
  { value: "brand", label: "Vert" },
  { value: "info", label: "Bleu" },
  { value: "warn", label: "Orange" },
  { value: "danger", label: "Rouge" },
];

/** Ajouter un événement à l'agenda (personnel). */
export function AddAgendaEvent({
  targets,
  defaultDay,
}: {
  targets: PublishTargets;
  defaultDay: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsOn, setStartsOn] = useState(defaultDay);
  const [endsOn, setEndsOn] = useState("");
  const [target, setTarget] = useState(
    targets.wholeSchool ? "etablissement" : (targets.classes[0]?.id ?? ""),
  );
  const [tone, setTone] = useState<AgendaInput["tone"]>("neutral");
  const [holiday, setHoliday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const options = [
    ...(targets.wholeSchool
      ? [{ value: "etablissement", label: "Tout l'établissement" }]
      : []),
    ...targets.classes.map((c) => ({ value: c.id, label: c.name })),
  ];

  const submit = () => {
    if (!title.trim()) return setError("Indiquez un titre.");
    if (!startsOn) return setError("Indiquez une date.");
    if (endsOn && endsOn < startsOn)
      return setError("La date de fin précède la date de début.");
    setError(null);
    start(async () => {
      const r = await addAgendaEvent({
        title: title.trim(),
        startsOn,
        endsOn: endsOn || null,
        classId: target === "etablissement" ? null : target,
        tone,
        holiday,
      });
      if (!r.ok) return setError(r.error);
      toast({ title: `« ${title.trim()} » ajouté à l'agenda` });
      setTitle("");
      setEndsOn("");
      setHoliday(false);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Ajouter un événement"
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Ajouter un événement
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TextField
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Date"
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            required
          />
          <TextField
            label="Jusqu'au (facultatif)"
            type="date"
            value={endsOn}
            min={startsOn}
            onChange={(e) => setEndsOn(e.target.value)}
          />
        </div>
        <SelectField
          label="Pour"
          options={options}
          value={target}
          onValueChange={setTarget}
        />
        <SelectField
          label="Couleur"
          options={TONES}
          value={tone}
          onValueChange={(v) => setTone(v as AgendaInput["tone"])}
        />
        {targets.wholeSchool && (
          <Checkbox
            checked={holiday}
            onCheckedChange={setHoliday}
            label="Vacances ou jour sans classe"
          />
        )}
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="h-10 px-4 text-label"
          >
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Liste des événements du mois, avec leur retrait pour qui en a le droit. */
export function AgendaEventList({ events }: { events: AgendaEventView[] }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section
      aria-labelledby="agenda-liste"
      className="rounded-card border border-line bg-surface"
    >
      <h2
        id="agenda-liste"
        className="m-0 border-b border-line px-5 py-3.5 font-display text-card font-bold"
      >
        Événements du mois
      </h2>
      {events.length === 0 ? (
        <p className="m-0 px-5 py-6 text-ui text-ink-2">
          Aucun événement ce mois-ci.
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-soft px-5 py-2.5 last:border-b-0"
            >
              <span className="tabular w-32 text-caption text-ink-muted">
                {formatDateShort(e.startsOn)}
                {e.endsOn && ` → ${formatDateShort(e.endsOn)}`}
              </span>
              <b className="flex-1 text-label">{e.title}</b>
              <Badge tone={e.tone}>
                {e.holiday ? "Vacances" : (e.className ?? "Établissement")}
              </Badge>
              {e.canDelete && (
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`Retirer « ${e.title} »`}
                  onClick={() => {
                    if (!window.confirm(`Retirer « ${e.title} » de l'agenda ?`))
                      return;
                    start(async () => {
                      const r = await deleteAgendaEvent(e.id);
                      toast({ title: r.ok ? "Événement retiré" : r.error });
                      if (r.ok) router.refresh();
                    });
                  }}
                  className="flex size-11 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                >
                  <Icon name="delete" size={22} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
