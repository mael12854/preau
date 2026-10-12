"use client";

import { useRef, useState } from "react";
import { DistributionBar, PastilleDot, PastilleLegend } from "@/components/ui/pastille";
import { SegmentedControl } from "@/components/ui/segmented";
import { SubjectChip, SubjectDot } from "@/components/ui/subject-chip";
import { cn } from "@/lib/cn";
import { distribution, EVAL_META } from "@/lib/evaluation";
import { COMMENTS, DEFAULT_SELECTION, EVALUATIONS, skillLevels, SUBJECTS, type SubjectKey } from "@/lib/mock";

const COLS = "@2xl:grid-cols-[12.5rem_minmax(0,1fr)_8.75rem]";
const TERMS = [
  { value: "t1", label: "Trimestre 1" },
  { value: "t2", label: "Trimestre 2" },
  { value: "t3", label: "Trimestre 3" },
];

/** Évaluations : matière × pastilles, répartition, panneau de détail. Aucune moyenne. */
export function EvaluationsScreen() {
  const [term, setTerm] = useState("t1");
  const [sel, setSel] = useState(DEFAULT_SELECTION);
  const detailRef = useRef<HTMLHeadingElement>(null);
  const rows = Object.keys(EVALUATIONS) as SubjectKey[];
  const s = SUBJECTS[sel.subject];
  const e = EVALUATIONS[sel.subject]![sel.index];
  const skills = skillLevels(e.level);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <SegmentedControl aria-label="Période" options={TERMS} value={term} onValueChange={setTerm} />
          <PastilleLegend />
        </div>

        <div className="@container overflow-hidden rounded-card border border-line bg-surface">
          <div aria-hidden="true" className={cn("hidden gap-4 border-b border-line bg-surface-2 px-5 py-3 text-meta text-ink-muted @2xl:grid", COLS)}>
            <span>Matière</span>
            <span>Évaluations du trimestre</span>
            <span>Répartition</span>
          </div>
          {term !== "t1" ? (
            <p className="m-0 px-5 py-10 text-center text-ui text-ink-2">
              Les évaluations du {TERMS.find((t) => t.value === term)?.label.toLowerCase()} apparaîtront ici.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {rows.map((k) => {
                const sub = SUBJECTS[k];
                const evs = EVALUATIONS[k]!;
                return (
                  <li key={k} className={cn("grid items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-3 last:border-b-0", COLS)}>
                    <div className="flex items-center gap-2.5">
                      <SubjectDot hue={sub.hue} />
                      <div className="flex flex-col">
                        <h2 className="m-0 text-ui font-bold">{sub.name}</h2>
                        <span className="text-meta text-ink-muted">{sub.prof}</span>
                      </div>
                    </div>
                    <ul className="m-0 -my-2.5 flex list-none flex-wrap p-0" aria-label={`Évaluations de ${sub.name}`}>
                      {evs.map((ev, i) => {
                        const active = sel.subject === k && sel.index === i;
                        return (
                          <li key={ev.title}>
                            <button
                              type="button"
                              aria-pressed={active}
                              aria-label={`${ev.title}, ${ev.date} : ${EVAL_META[ev.level].label}`}
                              title={`${ev.title} · ${EVAL_META[ev.level].label}`}
                              onClick={() => {
                                setSel({ subject: k, index: i });
                                // Sur petit écran, le détail est sous le tableau : on y amène le focus.
                                if (window.matchMedia("(max-width: 63.99rem)").matches) detailRef.current?.focus();
                              }}
                              className="flex h-11 min-w-11 items-center gap-1.5 rounded-control px-1.5 text-meta text-ink-2 hover:bg-neutral-bg aria-pressed:font-bold aria-pressed:text-ink"
                            >
                              <span className={cn("flex rounded-full", active && "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--ink)]")}>
                                <PastilleDot value={ev.level} size={24} />
                              </span>
                              {EVAL_META[ev.level].short}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <DistributionBar counts={distribution(evs.map((x) => x.level))} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <aside aria-labelledby="eval-detail" aria-live="polite" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-[1.375rem] lg:sticky lg:top-6">
        <SubjectChip name={s.name} hue={s.hue} />
        <div>
          <h2 id="eval-detail" ref={detailRef} tabIndex={-1} className="m-0 font-display text-detail font-bold tracking-[-0.01em]">
            {e.title}
          </h2>
          <p className="m-0 mt-1 text-caption text-ink-muted">
            {e.date} · {s.prof}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-alert bg-bg p-3.5">
          <PastilleDot value={e.level} size={28} />
          <b className="text-body">{EVAL_META[e.level].label}</b>
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 text-meta font-normal text-ink-muted">Compétences évaluées</h3>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {s.skills.map((skill, i) => (
              <li key={skill} className="flex items-center gap-2.5 text-label">
                <PastilleDot value={skills[i]} size={16} />
                <span className="flex-1">{skill}</span>
                <span className="text-caption text-ink-muted">{EVAL_META[skills[i]].legend}</span>
              </li>
            ))}
          </ul>
        </div>
        <blockquote className="m-0 border-t border-line-soft pt-3.5 text-label leading-normal text-ink-2">« {COMMENTS[e.level]} »</blockquote>
      </aside>
    </div>
  );
}
