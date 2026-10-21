"use client";

import { useState, useTransition } from "react";
import { publishAssessment, setScore, setSkillLevels, validateAttendance } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PastilleDot } from "@/components/ui/pastille";
import { AssessmentPicker, DeleteAssessment, NewAssessment } from "@/components/screens/evaluation-new";
import { SegmentedTabs } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { HomeworkChoice } from "@/lib/data/homework";
import type { AppelData } from "@/lib/data/teacher";
import { evalText, nextEvalValue, type EvalScale, type EvalValue } from "@/lib/evaluation";
import { formatScore, parseScore, type Grading } from "@/lib/grading";
import { ATTENDANCE_OPTIONS, type Attendance } from "@/lib/reference";

const ATTENDANCE_STYLE: Record<Attendance, string> = {
  present: "aria-checked:border-ok aria-checked:bg-ok-bg aria-checked:text-ok",
  absent: "aria-checked:border-danger aria-checked:bg-danger-bg aria-checked:text-danger",
  late: "aria-checked:border-warn aria-checked:bg-warn-bg aria-checked:text-warn",
};

const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`;

function AppelTab({ data }: { data: AppelData }) {
  const toast = useToast();
  const [att, setAtt] = useState(data.attendance);
  const [validated, setValidated] = useState(data.lesson?.validated ?? false);
  const [pending, start] = useTransition();
  if (!data.lesson) return <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucun cours à appeler aujourd&apos;hui.</p>;
  const lesson = data.lesson;
  const c = { present: 0, absent: 0, late: 0 };
  data.students.forEach((s) => c[att[s.id] ?? "present"]++);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3.5 text-label">
        <span aria-live="polite">
          {plural(c.present, "présent")} · {plural(c.absent, "absent")} · {plural(c.late, "retard")} — {data.students.length} élèves
          {validated && <b className="text-ok"> · Appel validé</b>}
        </span>
        <Button
          className="h-10 px-4 text-label"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await validateAttendance(lesson.id, att);
              if (r.ok) setValidated(true);
              toast({ title: r.ok ? "Appel validé et transmis à la vie scolaire" : r.error });
            })
          }
        >
          {validated ? "Mettre à jour l'appel" : "Valider l'appel"}
        </Button>
      </div>
      <ul className="m-0 list-none p-0">
        {data.students.map((s) => (
          <li key={s.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 border-b border-line-soft px-5 py-2.5 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
            <Avatar initials={s.initials} size={34} />
            <b id={`eleve-${s.id}`} className="text-ui">
              {s.name}
            </b>
            <div role="radiogroup" aria-labelledby={`eleve-${s.id}`} className="col-span-2 flex gap-1.5 sm:col-span-1">
              {ATTENDANCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={(att[s.id] ?? "present") === o.value}
                  onClick={() => setAtt((a) => ({ ...a, [s.id]: o.value }))}
                  className={cn(
                    "relative h-9 min-w-[5.5rem] flex-1 rounded-[9px] border-[1.5px] border-line bg-surface px-3 text-sm font-bold text-ink-2 after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] sm:flex-none",
                    ATTENDANCE_STYLE[o.value],
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvaluationTab({ data, scale }: { data: AppelData; scale: EvalScale }) {
  const toast = useToast();
  const a = data.assessment;
  const [grid, setGrid] = useState(a?.grid ?? {});
  const [published, setPublished] = useState(a?.published ?? false);
  const [announce, setAnnounce] = useState("");
  const [pending, start] = useTransition();
  if (!a) return <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucune évaluation pour l&apos;instant. Créez-en une avec « Nouvelle évaluation ».</p>;

  const cycle = (studentId: string, name: string, j: number, v: EvalValue) => {
    const next = nextEvalValue(v);
    const row = [...grid[studentId]];
    row[j] = next;
    setGrid((g) => ({ ...g, [studentId]: row }));
    setAnnounce(`${name}, ${a.skills[j]} : ${evalText(next, scale).label}`);
    start(async () => {
      const r = await setSkillLevels(a.id, studentId, row);
      if (!r.ok) toast({ title: r.error });
    });
  };

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3.5 text-label">
        <span>
          <b>{a.title}</b> · {a.label} · {published ? "publiée" : "cliquez sur une pastille pour changer de niveau"}
        </span>
        <Button
          className="h-10 px-4 text-label"
          disabled={published || pending}
          onClick={() =>
            start(async () => {
              const r = await publishAssessment(a.id);
              if (r.ok) setPublished(true);
              toast({ title: r.ok ? "Évaluations publiées pour les élèves et les familles" : r.error });
            })
          }
        >
          {published ? "Publiée" : "Publier"}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="relative overflow-x-auto" data-scroll-x>
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="sr-only">
            {a.title}, {a.label} : niveau par élève et par compétence
          </caption>
          <thead>
            <tr className="border-b border-line text-meta text-ink-muted">
              <th scope="col" className="px-5 py-2.5 text-left font-normal">
                Élève
              </th>
              {a.skills.map((s) => (
                <th key={s} scope="col" className="w-[9.375rem] px-1 py-2.5 text-center font-normal">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.evalStudents.map((s) => (
              <tr key={s.id} className="border-b border-line-soft last:border-b-0">
                <th scope="row" className="px-5 py-1.5 text-left text-ui font-bold">
                  {s.name}
                </th>
                {(grid[s.id] ?? []).map((v, j) => (
                  <td key={j} className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={published}
                      aria-label={`${s.name}, ${a.skills[j]} : ${evalText(v, scale).label}.${published ? "" : " Activer pour passer au niveau suivant."}`}
                      title={evalText(v, scale).label}
                      onClick={() => cycle(s.id, s.name, j, v)}
                      className="inline-flex h-11 min-w-16 items-center justify-center gap-2 rounded-control px-2.5 text-caption text-ink-2 hover:bg-neutral-bg disabled:hover:bg-transparent"
                    >
                      <PastilleDot value={v} size={20} className={v === "NE" ? "border-dashed" : undefined} />
                      <span>{evalText(v, scale).short}</span>
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Status = "NE" | "ABS" | "DISP";
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "NE", label: "Noté" },
  { value: "ABS", label: "Absent" },
  { value: "DISP", label: "Dispensé" },
];

/** Saisie des notes sur 20 (établissements notés sur 20). Aucune moyenne n'est calculée. */
function ScoreTab({ data }: { data: AppelData }) {
  const toast = useToast();
  const a = data.assessment;
  const initial = a?.scores ?? {};
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).map(([id, r]) => [id, r.score === null ? "" : formatScore(r.score)])),
  );
  const [status, setStatus] = useState<Record<string, Status>>(() =>
    Object.fromEntries(Object.entries(initial).map(([id, r]) => [id, r.status === "ABS" || r.status === "DISP" ? r.status : "NE"])),
  );
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [published, setPublished] = useState(a?.published ?? false);
  const [pending, start] = useTransition();
  if (!a) return <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucune évaluation pour l&apos;instant. Créez-en une avec « Nouvelle évaluation ».</p>;

  const save = (studentId: string, value: string, st: Status) => {
    const score = st === "NE" ? parseScore(value) : null;
    if (score === undefined) {
      setInvalid((v) => ({ ...v, [studentId]: true }));
      return;
    }
    setInvalid((v) => ({ ...v, [studentId]: false }));
    start(async () => {
      const r = await setScore(a.id, studentId, score, st);
      if (!r.ok) toast({ title: r.error });
    });
  };

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3.5 text-label">
        <span>
          <b>{a.title}</b> · {a.label} · {published ? "publiée" : "notes sur 20, au demi-point"}
        </span>
        <Button
          className="h-10 px-4 text-label"
          disabled={published || pending}
          onClick={() =>
            start(async () => {
              const r = await publishAssessment(a.id);
              if (r.ok) setPublished(true);
              toast({ title: r.ok ? "Notes publiées pour les élèves et les familles" : r.error });
            })
          }
        >
          {published ? "Publiée" : "Publier"}
        </Button>
      </div>
      <ul className="m-0 list-none p-0">
        {data.evalStudents.map((s) => {
          const st = status[s.id] ?? "NE";
          const inputId = `note-${s.id}`;
          return (
            <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 border-b border-line-soft px-5 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label htmlFor={inputId} className="text-ui font-bold">
                {s.name}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={inputId}
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={published || st !== "NE"}
                  aria-invalid={invalid[s.id] || undefined}
                  aria-describedby={invalid[s.id] ? `${inputId}-err` : undefined}
                  value={st === "NE" ? (text[s.id] ?? "") : ""}
                  onChange={(e) => setText((t) => ({ ...t, [s.id]: e.target.value }))}
                  onBlur={(e) => save(s.id, e.target.value, st)}
                  className="h-10 w-20 rounded-control border border-line bg-surface px-2.5 text-right text-ui tabular aria-invalid:border-danger disabled:bg-neutral-bg"
                />
                <span aria-hidden="true" className="text-label text-ink-muted">sur 20</span>
              </div>
              <div role="radiogroup" aria-label={`${s.name} : statut`} className="col-span-2 flex gap-1.5 sm:col-span-1">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    disabled={published}
                    aria-checked={st === o.value}
                    onClick={() => {
                      setStatus((v) => ({ ...v, [s.id]: o.value }));
                      save(s.id, text[s.id] ?? "", o.value);
                    }}
                    className="h-9 min-w-[5.5rem] flex-1 rounded-[9px] border-[1.5px] border-line bg-surface px-3 text-sm font-bold text-ink-2 aria-checked:border-brand aria-checked:bg-brand-tint aria-checked:text-brand sm:flex-none"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {invalid[s.id] && (
                <p id={`${inputId}-err`} className="col-span-full m-0 text-caption text-danger">
                  Saisissez une note entre 0 et 20, au demi-point (par exemple 14,5).
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Onglet Évaluation : créer une évaluation, choisir celle à saisir, puis la saisie. */
function EvalPanel({
  data,
  choices,
  today,
  scale,
  grading,
}: {
  data: AppelData;
  choices: HomeworkChoice[];
  today: string;
  scale: EvalScale;
  grading: Grading;
}) {
  const id = data.assessment?.id ?? null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <AssessmentPicker options={data.assessments} value={id} />
        <div className="flex flex-wrap gap-2">
          {data.assessment && <DeleteAssessment id={data.assessment.id} title={data.assessment.title} />}
          <NewAssessment choices={choices} today={today} grading={grading} />
        </div>
      </div>
      {grading === "note20" ? <ScoreTab key={id} data={data} /> : <EvaluationTab key={id} data={data} scale={scale} />}
    </div>
  );
}

/** Appel & évaluation (professeur), enregistrés dans Supabase. */
export function AppelScreen({
  data,
  choices = [],
  today = "",
  scale = "college",
  grading = "competences",
  initialTab = "appel",
}: {
  data: AppelData;
  choices?: HomeworkChoice[];
  today?: string;
  scale?: EvalScale;
  grading?: Grading;
  initialTab?: "appel" | "eval";
}) {
  return (
    <SegmentedTabs
      aria-label="Saisie"
      defaultValue={initialTab}
      aside={
        data.lesson && (
          <p className="m-0 text-label text-ink-2">
            <b className="text-ink">{data.lesson.label}</b> · {data.lesson.detail}
          </p>
        )
      }
      tabs={[
        { value: "appel", label: "Appel", content: <AppelTab data={data} /> },
        { value: "eval", label: "Évaluation", content: <EvalPanel data={data} choices={choices} today={today} scale={scale} grading={grading} /> },
      ]}
    />
  );
}
