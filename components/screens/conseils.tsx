"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCouncil } from "@/app/(app)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import type { CouncilStatus } from "@/lib/councils";
import type { CouncilSummary } from "@/lib/data/councils";
import { formatDateShort, formatTimeText } from "@/lib/format";

export const STATUS_LABEL: Record<CouncilStatus, { label: string; tone: "info" | "warn" | "ok" }> = {
  preparation: { label: "Préparation", tone: "info" },
  en_cours: { label: "En cours", tone: "warn" },
  cloture: { label: "Clôturé", tone: "ok" },
};

/** Bornes proposées pour un trimestre (année scolaire de septembre à juillet). */
function termBounds(term: number, today: string) {
  const y = Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 9 ? 1 : 0);
  return term === 1
    ? [`${y}-09-01`, `${y}-12-20`]
    : term === 2
      ? [`${y + 1}-01-01`, `${y + 1}-03-31`]
      : [`${y + 1}-04-01`, `${y + 1}-07-04`];
}

function NewCouncil({
  classes,
  teachers,
  today,
}: {
  classes: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [term, setTerm] = useState("1");
  const [day, setDay] = useState(today);
  const [time, setTime] = useState("17:00");
  const [[from, to], setBounds] = useState(() => termBounds(1, today));
  const [head, setHead] = useState("aucun");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nouveau conseil de classe"
      description="Les bulletins de la classe sont préparés ; les professeurs de la classe saisissent leurs appréciations."
      trigger={
        <Button icon="add" className="h-11 px-4 text-label">
          Nouveau conseil
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await createCouncil({
              classId,
              term: Number(term),
              heldAt: new Date(`${day}T${time}`).toISOString(),
              periodStart: from,
              periodEnd: to,
              headTeacherId: head === "aucun" ? null : head,
            });
            if (!r.ok) return setError(r.error);
            setOpen(false);
            router.push(`/conseils/${r.id}`);
          });
        }}
      >
        <SelectField label="Classe" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onValueChange={setClassId} />
        <SelectField
          label="Trimestre"
          options={["1", "2", "3"].map((t) => ({ value: t, label: `Trimestre ${t}` }))}
          value={term}
          onValueChange={(v) => {
            setTerm(v);
            setBounds(termBounds(Number(v), today));
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date du conseil" type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
          <TextField label="Heure" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          <TextField label="Période du" type="date" value={from} onChange={(e) => setBounds([e.target.value, to])} required />
          <TextField label="au" type="date" value={to} onChange={(e) => setBounds([from, e.target.value])} required />
        </div>
        <SelectField
          label="Professeur principal"
          options={[{ value: "aucun", label: "Aucun (la direction conduit le conseil)" }, ...teachers.map((t) => ({ value: t.id, label: t.name }))]}
          value={head}
          onValueChange={setHead}
        />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Création…" : "Créer le conseil"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Conseils de classe : liste (statut, date, professeur principal) et création (direction, secrétariat). */
export function CouncilsScreen({
  councils,
  canCreate,
  classes,
  teachers,
  today,
}: {
  councils: CouncilSummary[];
  canCreate: boolean;
  classes: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  today: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {canCreate && classes.length > 0 && (
        <div className="flex justify-end">
          <NewCouncil classes={classes} teachers={teachers} today={today} />
        </div>
      )}
      {councils.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Aucun conseil de classe pour l&apos;instant.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {councils.map((c) => (
            <li key={c.id}>
              <Link href={`/conseils/${c.id}`} className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4 hover:border-line-strong">
                <span className="flex items-start justify-between gap-2">
                  <b className="font-display text-h3">{c.className}</b>
                  <Badge tone={STATUS_LABEL[c.status].tone}>{STATUS_LABEL[c.status].label}</Badge>
                </span>
                <span className="text-label text-ink-2">
                  Trimestre {c.term} · {formatDateShort(c.heldAt)} à {formatTimeText(c.heldAt)}
                </span>
                {c.headTeacher && (
                  <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                    <Icon name="badge" size={16} /> {c.headTeacher}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
