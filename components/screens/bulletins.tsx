"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SubjectDot } from "@/components/ui/subject-chip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { EVAL_LEVELS, EVAL_META } from "@/lib/evaluation";
import { DEFAULT_PERIOD, REPORT, REPORT_PERIODS, SUBJECTS } from "@/lib/mock";

const COLS = "@2xl:grid-cols-[10.625rem_4fr_6fr]";

/** Bulletins : périodes, positionnement sur 4 cases, appréciations, mention du conseil. */
export function BulletinsScreen() {
  const toast = useToast();
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const current = REPORT_PERIODS.find((p) => p.id === period)!;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[16.25rem_minmax(0,1fr)]">
      <nav aria-label="Périodes">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {REPORT_PERIODS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={p.id === period}
                aria-disabled={!p.available}
                onClick={() => (p.available ? setPeriod(p.id) : toast({ title: `Bulletin pas encore publié · ${p.detail}` }))}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-alert border-[1.5px] bg-surface p-3.5 text-left",
                  p.id === period ? "border-brand" : "border-line hover:border-line-strong",
                  !p.available && "opacity-70",
                )}
              >
                <b className="text-ui">{p.title}</b>
                <span className="text-caption text-ink-muted">{p.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <article aria-labelledby="bulletin-title" className="@container overflow-hidden rounded-card border border-line bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <h2 id="bulletin-title" className="m-0 font-display text-title-sm font-bold">
              {current.reportTitle}
            </h2>
            <p className="m-0 text-sm text-ink-muted">{REPORT.student}</p>
          </div>
          <Button variant="secondary" className="h-10 px-3.5 text-label" icon="download" onClick={() => toast({ title: "Téléchargement du bulletin en PDF" })}>
            PDF
          </Button>
        </header>

        {period !== DEFAULT_PERIOD ? (
          <p className="m-0 px-6 py-10 text-ui text-ink-2">Ce bulletin est disponible au format PDF.</p>
        ) : (
          <>
            <div aria-hidden="true" className={cn("hidden gap-4 border-b border-line bg-surface-2 px-6 py-2.5 text-meta text-ink-muted @2xl:grid", COLS)}>
              <span>Matière</span>
              <span>Positionnement</span>
              <span>Appréciation</span>
            </div>
            <ul className="m-0 list-none p-0">
              {REPORT.lines.map((r) => {
                const s = SUBJECTS[r.subject];
                return (
                  <li key={r.subject} className={cn("grid items-center gap-x-4 gap-y-2 border-b border-line-soft px-6 py-3.5", COLS)}>
                    <h3 className="m-0 flex items-center gap-2 text-label font-bold">
                      <SubjectDot hue={s.hue} size={9} />
                      {s.name}
                    </h3>
                    <div role="img" aria-label={`Positionnement : ${EVAL_META[r.level].label}`} className="flex items-center gap-1.5">
                      {EVAL_LEVELS.map((l) => (
                        <span key={l} className="h-[1.375rem] flex-1 rounded-[5px]" style={{ background: l === r.level ? EVAL_META[l].color! : "var(--neutral-bg)" }} />
                      ))}
                      <span className="w-[5.625rem] pl-1.5 text-caption text-ink-2">{EVAL_META[r.level].short}</span>
                    </div>
                    <p className="m-0 text-label leading-[1.45] text-ink-2">{r.comment}</p>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-4 bg-brand-tint px-6 py-[1.125rem]">
              <Icon name="workspace_premium" size={24} className="text-brand" />
              <p className="m-0 text-ui leading-[1.45]">
                <b>{REPORT.council.title}</b> {REPORT.council.text}
              </p>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
