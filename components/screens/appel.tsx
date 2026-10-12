"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PastilleDot } from "@/components/ui/pastille";
import { SegmentedTabs } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { EVAL_META, nextEvalValue } from "@/lib/evaluation";
import { ATTENDANCE_OPTIONS, CLASS_SESSION, defaultAttendance, defaultGrid, initials, STUDENTS, type Attendance } from "@/lib/mock";

const ATTENDANCE_STYLE: Record<Attendance, string> = {
  present: "aria-checked:border-ok aria-checked:bg-ok-bg aria-checked:text-ok",
  absent: "aria-checked:border-danger aria-checked:bg-danger-bg aria-checked:text-danger",
  late: "aria-checked:border-warn aria-checked:bg-warn-bg aria-checked:text-warn",
};

const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`;

function AppelTab() {
  const toast = useToast();
  const [att, setAtt] = useState(defaultAttendance);
  const c = { present: 0, absent: 0, late: 0 };
  STUDENTS.forEach((n) => c[att[n]]++);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3.5 text-label">
        <span aria-live="polite">
          {plural(c.present, "présent")} · {plural(c.absent, "absent")} · {plural(c.late, "retard")} — {STUDENTS.length} élèves
        </span>
        <Button className="h-10 px-4 text-label" onClick={() => toast({ title: "Appel validé et transmis à la vie scolaire" })}>
          Valider l&apos;appel
        </Button>
      </div>
      <ul className="m-0 list-none p-0">
        {STUDENTS.map((n) => (
          <li key={n} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 border-b border-line-soft px-5 py-2.5 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
            <Avatar initials={initials(n)} size={34} />
            <b id={`eleve-${initials(n)}`} className="text-ui">
              {n}
            </b>
            <div role="radiogroup" aria-labelledby={`eleve-${initials(n)}`} className="col-span-2 flex gap-1.5 sm:col-span-1">
              {ATTENDANCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={att[n] === o.value}
                  onClick={() => setAtt((a) => ({ ...a, [n]: o.value }))}
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

function EvaluationTab() {
  const toast = useToast();
  const [grid, setGrid] = useState(defaultGrid);
  const [announce, setAnnounce] = useState("");
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-5 py-3.5 text-label">
        <span>
          <b>{CLASS_SESSION.evaluation}</b> · cliquez sur une pastille pour changer de niveau
        </span>
        <Button className="h-10 px-4 text-label" onClick={() => toast({ title: "Évaluations publiées pour les élèves et les familles" })}>
          Publier
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="relative overflow-x-auto" data-scroll-x>
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="sr-only">
            {CLASS_SESSION.evaluation}, {CLASS_SESSION.label} : niveau par élève et par compétence
          </caption>
          <thead>
            <tr className="border-b border-line text-meta text-ink-muted">
              <th scope="col" className="px-5 py-2.5 text-left font-normal">
                Élève
              </th>
              {CLASS_SESSION.skills.map((s) => (
                <th key={s} scope="col" className="w-[9.375rem] px-1 py-2.5 text-center font-normal">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((n) => (
              <tr key={n} className="border-b border-line-soft last:border-b-0">
                <th scope="row" className="px-5 py-1.5 text-left text-ui font-bold">
                  {n}
                </th>
                {grid[n].map((v, j) => (
                  <td key={j} className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      aria-label={`${n}, ${CLASS_SESSION.skills[j]} : ${EVAL_META[v].label}. Activer pour passer au niveau suivant.`}
                      title={EVAL_META[v].label}
                      onClick={() => {
                        const next = nextEvalValue(v);
                        setGrid((g) => {
                          const row = [...g[n]];
                          row[j] = next;
                          return { ...g, [n]: row };
                        });
                        setAnnounce(`${n}, ${CLASS_SESSION.skills[j]} : ${EVAL_META[next].label}`);
                      }}
                      className="inline-flex h-11 min-w-16 items-center justify-center gap-2 rounded-control px-2.5 text-caption text-ink-2 hover:bg-neutral-bg"
                    >
                      <PastilleDot value={v} size={20} className={v === "NE" ? "border-dashed" : undefined} />
                      <span>{EVAL_META[v].short}</span>
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

/** Appel & évaluation (professeur). */
export function AppelScreen() {
  return (
    <SegmentedTabs
      aria-label="Saisie"
      defaultValue="appel"
      aside={
        <p className="m-0 text-label text-ink-2">
          <b className="text-ink">{CLASS_SESSION.label}</b> · {CLASS_SESSION.detail}
        </p>
      }
      tabs={[
        { value: "appel", label: "Appel", content: <AppelTab /> },
        { value: "eval", label: "Évaluation", content: <EvaluationTab /> },
      ]}
    />
  );
}
