"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeeting } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import type { MeetingSummary } from "@/lib/data/meetings";
import { addDays, formatDateLong } from "@/lib/format";

function NewMeeting({ classes, today }: { classes: { id: string; name: string }[]; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Réunion parents-professeurs");
  const [day, setDay] = useState(addDays(today, 14));
  const [starts, setStarts] = useState("17:00");
  const [ends, setEnds] = useState("20:00");
  const [minutes, setMinutes] = useState("10");
  const [cancel, setCancel] = useState("24");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nouvelle réunion parents-profs"
      description="Ensuite, chaque professeur ouvre ses créneaux ; les familles réservent depuis leur espace."
      trigger={
        <Button icon="add" className="h-11 px-4 text-label">
          Nouvelle réunion
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!picked.length) return setError("Choisissez au moins une classe.");
          start(async () => {
            const r = await createMeeting({
              title,
              day,
              starts,
              ends,
              slotMinutes: Number(minutes),
              cancelHours: Number(cancel),
              classIds: picked,
            });
            if (!r.ok) return setError(r.error);
            setOpen(false);
            router.push(`/reunions/${r.id}`);
          });
        }}
      >
        <TextField label="Titre" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TextField label="Jour" type="date" min={today} value={day} onChange={(e) => setDay(e.target.value)} required />
          <TextField label="De" type="time" value={starts} onChange={(e) => setStarts(e.target.value)} required />
          <TextField label="À" type="time" value={ends} onChange={(e) => setEnds(e.target.value)} required />
          <SelectField
            label="Durée d'un créneau"
            options={["5", "10", "15", "20", "30"].map((v) => ({ value: v, label: `${v} min` }))}
            value={minutes}
            onValueChange={setMinutes}
          />
          <SelectField
            label="Annulation jusqu'à"
            options={[
              { value: "0", label: "l'heure du rendez-vous" },
              { value: "2", label: "2 h avant" },
              { value: "12", label: "12 h avant" },
              { value: "24", label: "24 h avant" },
              { value: "48", label: "48 h avant" },
            ]}
            value={cancel}
            onValueChange={setCancel}
          />
        </div>
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
          <legend className="mb-1 text-label font-bold">Classes concernées</legend>
          {classes.map((c) => (
            <label key={c.id} className="flex min-h-10 cursor-pointer items-center gap-3 text-ui">
              <Checkbox checked={picked.includes(c.id)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))} />
              {c.name}
            </label>
          ))}
        </fieldset>
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Création…" : "Créer la réunion"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Réunions parents-profs : liste, et création pour le personnel. */
export function MeetingsScreen({
  meetings,
  canCreate,
  classes,
  staff,
  today,
}: {
  meetings: MeetingSummary[];
  canCreate: boolean;
  classes: { id: string; name: string }[];
  staff: boolean;
  today: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {canCreate && (
        <div className="flex justify-end">
          <NewMeeting classes={classes} today={today} />
        </div>
      )}
      {meetings.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          {staff ? "Aucune réunion pour l'instant." : "Aucune réunion parents-profs prévue pour vos enfants."}
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link href={`/reunions/${m.id}`} className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4 hover:border-line-strong">
                <span className="flex items-start justify-between gap-2">
                  <b className="font-display text-h3">{m.title}</b>
                  {m.day < today ? <Badge tone="neutral">Passée</Badge> : m.open ? <Badge tone="ok">Réservations ouvertes</Badge> : <Badge tone="warn">Fermée</Badge>}
                </span>
                <span className="text-label text-ink-2">
                  {formatDateLong(m.day, true)} · {m.starts} – {m.ends}
                </span>
                <span className="text-caption text-ink-muted">{m.classes.join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
