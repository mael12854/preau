"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createMathAssignment, removeMathAssignment } from "@/app/(app)/exercices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { StudentAssignment, TeacherAssignment } from "@/lib/data/maths";
import { formatDateLong } from "@/lib/format";
import { scoreShort } from "@/lib/grading";
import { EXERCISES } from "@/lib/maths/catalog";
import { CHAPTERS } from "@/lib/maths/chapters";
import { type Level, LEVELS, Rng } from "@/lib/maths/core";

const exerciseTitle = new Map(EXERCISES.map((e) => [e.id, e.title]));

/** Banque d'exercices par niveau et chapitre, avec un exemple tiré à la demande. */
function Catalog({
  level,
  selected,
  onToggle,
}: {
  level: Level;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [example, setExample] = useState<Record<string, { prompt: string; answer: string } | undefined>>({});
  const chapters = CHAPTERS.filter((c) => c.level === level);
  return (
    <div className="flex flex-col gap-2">
      {chapters.map((c) => {
        const list = EXERCISES.filter((e) => e.chapter === c.id);
        const n = list.filter((e) => selected.includes(e.id)).length;
        return (
          <details key={c.id} className="rounded-card border border-line bg-surface" open={n > 0}>
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 py-2 text-label font-bold">
              {c.title}
              <span className="text-caption font-normal text-ink-muted">
                {n ? `${n} choisi${n > 1 ? "s" : ""} · ` : ""}
                {list.length} exercice{list.length > 1 ? "s" : ""}
              </span>
            </summary>
            <ul className="m-0 flex list-none flex-col border-t border-line-soft p-0">
              {list.map((e) => (
                <li key={e.id} className="flex flex-col gap-1 border-b border-line-soft px-4 py-2 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-3 text-label">
                      <Checkbox checked={selected.includes(e.id)} onCheckedChange={() => onToggle(e.id)} />
                      {e.title}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const q = e.make(new Rng(Math.floor(Math.random() * 2 ** 31)));
                        setExample((x) => ({ ...x, [e.id]: { prompt: q.prompt, answer: q.answer } }));
                      }}
                      className="flex min-h-10 items-center gap-1 rounded-control px-2 text-caption font-bold text-brand hover:bg-neutral-bg"
                    >
                      <Icon name="visibility" size={16} /> Exemple
                    </button>
                  </div>
                  {example[e.id] && (
                    <p className="m-0 rounded-control bg-surface-2 px-3 py-2 text-caption whitespace-pre-line">
                      {example[e.id]!.prompt}
                      <span className="block text-ink-muted">Réponse : {example[e.id]!.answer.replace(/-/g, "−").replace(/\./g, ",")}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function LevelPicker({ level, setLevel }: { level: Level; setLevel: (l: Level) => void }) {
  return (
    <div role="radiogroup" aria-label="Niveau" className="flex flex-wrap gap-1.5">
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === level}
          onClick={() => setLevel(l)}
          className="min-h-10 rounded-control border border-line px-3 text-label font-bold aria-checked:border-brand aria-checked:bg-brand aria-checked:text-on-brand"
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Enseignant : donner une série (choix dans la banque). */
function NewAssignment({ classes, today, defaultLevel }: { classes: { id: string; name: string }[]; today: string; defaultLevel: Level }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>(defaultLevel);
  const [selected, setSelected] = useState<string[]>([]);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(today);
  const [per, setPer] = useState("3");
  const [max, setMax] = useState("illimite");
  const [toEval, setToEval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  if (!classes.length) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Donner des exercices"
      description="Choisissez des exercices dans la banque. Chaque élève a ses propres valeurs ; la correction est automatique."
      className="w-[min(46rem,calc(100vw-2rem))]"
      trigger={
        <Button icon="add" className="h-10 px-4 text-label">
          Donner des exercices
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!selected.length) return setError("Choisissez au moins un exercice.");
          setError(null);
          start(async () => {
            const r = await createMathAssignment({
              classId,
              title: title.trim() || `Exercices (${selected.length})`,
              exerciseIds: selected,
              perExercise: Number(per),
              due,
              maxAttempts: max === "illimite" ? null : Number(max),
              toEvaluation: toEval,
            });
            if (!r.ok) return setError(r.error);
            toast({ title: "Exercices donnés à la classe" });
            setOpen(false);
            setSelected([]);
            setTitle("");
            router.refresh();
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Classe" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onValueChange={setClassId} />
          <TextField label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex. Fractions — révisions" />
          <TextField label="Pour le" type="date" min={today} value={due} onChange={(e) => setDue(e.target.value)} required />
          <SelectField
            label="Questions par exercice"
            options={["1", "2", "3", "4", "5", "6", "8", "10"].map((v) => ({ value: v, label: v }))}
            value={per}
            onValueChange={setPer}
          />
          <SelectField
            label="Nombre d'essais"
            options={[{ value: "illimite", label: "Illimité (meilleure note gardée)" }, ...["1", "2", "3", "5"].map((v) => ({ value: v, label: v }))]}
            value={max}
            onValueChange={setMax}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end text-label">
            <Checkbox checked={toEval} onCheckedChange={setToEval} />
            Compte dans les évaluations (mathématiques)
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-label">Banque d&apos;exercices · {selected.length} choisi{selected.length > 1 ? "s" : ""}</b>
            <LevelPicker level={level} setLevel={setLevel} />
          </div>
          <Catalog level={level} selected={selected} onToggle={toggle} />
        </div>
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="sticky bottom-0 flex justify-end bg-surface pt-2">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Envoi…" : `Donner ${selected.length || ""} exercice${selected.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

const due = (d: string) => `Pour le ${formatDateLong(d)}`;

export function TeacherMaths({
  assignments,
  classes,
  today,
  defaultLevel,
}: {
  assignments: TeacherAssignment[];
  classes: { id: string; name: string }[];
  today: string;
  defaultLevel: Level;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Link href="/exercices/cours" className="flex h-10 items-center gap-2 rounded-control border border-line px-4 text-label font-bold hover:border-line-strong">
          <Icon name="menu_book" size={20} /> Cours de maths
        </Link>
        <NewAssignment classes={classes} today={today} defaultLevel={defaultLevel} />
      </div>
      {assignments.length === 0 ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Aucune série pour l&apos;instant. Donnez des exercices à une classe : la correction et les notes sont automatiques.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {assignments.map((a) => {
            const done = a.students.filter((s) => s.attempts > 0);
            return (
              <li key={a.id}>
                <details className="rounded-card border border-line bg-surface">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <span className="flex min-w-0 flex-col">
                      <b className="text-ui">{a.title}</b>
                      <span className="text-caption text-ink-muted">
                        {a.className} · {due(a.dueOn)} · {a.exerciseIds.length} exercice{a.exerciseIds.length > 1 ? "s" : ""} × {a.perExercise} question
                        {a.perExercise > 1 ? "s" : ""}
                        {a.toEvaluation ? " · compte dans les évaluations" : ""}
                      </span>
                    </span>
                    <Badge tone={done.length === a.students.length && a.students.length ? "ok" : "neutral"}>
                      {done.length} / {a.students.length} élèves
                    </Badge>
                  </summary>
                  <div className="flex flex-col gap-3 border-t border-line-soft px-4 py-3">
                    <p className="m-0 text-caption text-ink-2">{a.exerciseIds.map((id) => exerciseTitle.get(id) ?? id).join(" · ")}</p>
                    <ul className="m-0 flex list-none flex-col p-0">
                      {a.students.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 border-b border-line-soft py-2 last:border-b-0">
                          <span className="text-label">{s.name}</span>
                          <span className="text-label tabular">
                            {s.best === null ? (
                              <span className="text-ink-muted">Pas encore fait</span>
                            ) : (
                              <>
                                <b>{scoreShort(s.best, "NE")}</b>
                                <span className="text-ink-muted"> · {s.attempts} essai{s.attempts > 1 ? "s" : ""}</span>
                              </>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="secondary"
                      disabled={pending}
                      className="h-9 self-end px-3 text-label"
                      onClick={() => {
                        if (!window.confirm(`Retirer la série « ${a.title} » ? Les élèves ne la verront plus (les notes déjà données restent).`)) return;
                        start(async () => {
                          const r = await removeMathAssignment(a.id);
                          toast({ title: r.ok ? "Série retirée" : r.error });
                          if (r.ok) router.refresh();
                        });
                      }}
                    >
                      Retirer la série
                    </Button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Élève : séries à faire et entraînement libre. Famille : séries et notes, en lecture. */
export function StudentMaths({
  assignments,
  today,
  defaultLevel,
  family,
  history,
}: {
  assignments: StudentAssignment[];
  today: string;
  defaultLevel: Level;
  family: boolean;
  history: { id: string; exerciseIds: string[]; score: number; at: string }[];
}) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>(defaultLevel);
  const [picked, setPicked] = useState<string[]>([]);
  const todo = assignments.filter((a) => a.dueOn >= today);
  const past = assignments.filter((a) => a.dueOn < today);
  const toggle = (id: string) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 5 ? s : [...s, id]));
  const card = (a: StudentAssignment) => {
    const left = a.maxAttempts === null ? null : Math.max(0, a.maxAttempts - a.attempts);
    return (
      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
        <span className="flex min-w-0 flex-col">
          <b className="text-ui">{a.title}</b>
          <span className="text-caption text-ink-muted">
            {due(a.dueOn)} · {a.exerciseIds.length * a.perExercise} questions
            {a.toEvaluation ? " · compte dans les évaluations" : ""}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {a.best !== null ? <Badge tone="ok">{scoreShort(a.best, "NE")}</Badge> : <Badge tone={a.dueOn >= today ? "warn" : "neutral"}>À faire</Badge>}
          {!family && (left === null || left > 0) && (
            <Link href={`/exercices/serie/${a.id}`} className="flex h-10 items-center rounded-control bg-brand px-4 text-label font-bold text-on-brand">
              {a.attempts ? "Refaire" : "Faire"}
            </Link>
          )}
        </span>
      </li>
    );
  };
  const tally = useMemo(() => history.slice(0, 5), [history]);
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <h2 className="m-0 font-display text-h3 font-bold">Exercices donnés</h2>
        {todo.length === 0 && past.length === 0 && (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">Aucun exercice donné pour l&apos;instant.</p>
        )}
        {todo.length > 0 && <ul className="m-0 flex list-none flex-col gap-2 p-0">{todo.map(card)}</ul>}
        {past.length > 0 && (
          <details>
            <summary className="cursor-pointer text-label font-bold text-ink-2">Séries passées ({past.length})</summary>
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">{past.map(card)}</ul>
          </details>
        )}
      </section>
      {!family && (
        <section className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 font-display text-h3 font-bold">S&apos;entraîner</h2>
            <LevelPicker level={level} setLevel={setLevel} />
          </div>
          <p className="m-0 text-label text-ink-2">Choisissez jusqu&apos;à 5 exercices : pas de note, autant d&apos;essais que vous voulez.</p>
          <Catalog level={level} selected={picked} onToggle={toggle} />
          <div className="sticky bottom-3 flex justify-end">
            <Button
              icon="play_arrow"
              disabled={!picked.length}
              onClick={() => router.push(`/exercices/entrainement?ex=${picked.join(",")}`)}
              className="h-11 px-5 text-label shadow-pop"
            >
              S&apos;entraîner{picked.length ? ` (${picked.length})` : ""}
            </Button>
          </div>
          {tally.length > 0 && (
            <details>
              <summary className="cursor-pointer text-label font-bold text-ink-2">Derniers entraînements</summary>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                {tally.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 text-label">
                    <span className="truncate">{t.exerciseIds.map((id) => exerciseTitle.get(id) ?? id).join(", ")}</span>
                    <b className="tabular">{scoreShort(t.score, "NE")}</b>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
