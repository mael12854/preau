"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { LessonView } from "@/lib/data/types";
import { formatTimeGrid, formatTimeText } from "@/lib/format";
import { subjectStyle } from "@/lib/subjects";
import { LessonDialog, type LessonEditOptions } from "./edt-editor";

const HOUR = 3.75; // rem par heure (60 px)

/** Cours simultanés (groupes en parallèle) : colonne et nombre de colonnes de chaque cours. */
function lanes(lessons: LessonView[]) {
  const sorted = [...lessons].sort((a, b) => a.start - b.start || a.end - b.end);
  const out = new Map<string, { lane: number; of: number }>();
  let cluster: LessonView[] = [];
  let ends: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    cluster.forEach((l) => (out.get(l.id)!.of = ends.length));
    cluster = [];
    ends = [];
  };
  for (const l of sorted) {
    if (l.start >= clusterEnd) flush();
    let lane = ends.findIndex((e) => e <= l.start);
    if (lane < 0) lane = ends.push(l.end) - 1;
    else ends[lane] = l.end;
    out.set(l.id, { lane, of: 1 });
    cluster.push(l);
    clusterEnd = Math.max(clusterEnd, l.end);
  }
  flush();
  return out;
}

export type WeekNav = {
  label: string;
  prev: string;
  next: string;
  current: string;
};

/**
 * Emploi du temps : grille de la semaine (8 h – 17 h, élargie si des cours débordent),
 * samedi et dimanche affichés s'il y a cours, jour courant en vert, cours annulé barré.
 */
export function EdtScreen({
  days,
  todayIndex,
  lessons,
  showClass,
  nav,
  edit,
}: {
  /** Clic sur un cours : le modifier (secrétariat), l'annuler ou le rétablir (son enseignant). */
  edit?: LessonEditOptions;
  days: string[];
  todayIndex: number;
  lessons: LessonView[];
  showClass?: boolean;
  nav?: WeekNav;
}) {
  const [selected, setSelected] = useState<LessonView | null>(null);
  const clickable = (l: LessonView) =>
    !!edit && (edit.mode === "manage" || l.teacherId === edit.me);
  const weekend = lessons.some((l) => l.day >= 5);
  const WEEK_DAYS = days.slice(0, weekend ? 7 : 5);
  const TODAY_INDEX = todayIndex < WEEK_DAYS.length ? todayIndex : -1;
  const TIMETABLE = WEEK_DAYS.map((_, i) => lessons.filter((l) => l.day === i));
  const LANES = TIMETABLE.map(lanes);
  const DAY_START = Math.min(8, ...lessons.map((l) => Math.floor(l.start)));
  const DAY_END = Math.max(17, ...lessons.map((l) => Math.ceil(l.end)));
  const HOURS = Array.from(
    { length: DAY_END - DAY_START },
    (_, i) => DAY_START + i,
  );
  const cols = weekend
    ? "grid-cols-[3.5rem_repeat(7,1fr)]"
    : "grid-cols-[3.5rem_repeat(5,1fr)]";
  return (
    <div className="flex flex-col gap-3">
      {nav && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            className="m-0 font-display text-card font-bold"
            aria-live="polite"
          >
            {nav.label}
          </h2>
          <div className="flex items-center gap-1.5">
            <Link
              href={nav.prev}
              aria-label="Semaine précédente"
              className="flex size-10 items-center justify-center rounded-control border border-line bg-surface hover:border-line-strong"
            >
              <Icon name="chevron_left" />
            </Link>
            <Link
              href={nav.current}
              className="flex h-10 items-center rounded-control border border-line bg-surface px-3.5 text-label no-underline hover:border-line-strong"
            >
              Cette semaine
            </Link>
            <Link
              href={nav.next}
              aria-label="Semaine suivante"
              className="flex size-10 items-center justify-center rounded-control border border-line bg-surface hover:border-line-strong"
            >
              <Icon name="chevron_right" />
            </Link>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {/* La grille 2D défile horizontalement sur petit écran (exception de redistribution RGAA). */}
        <div
          className="relative overflow-x-auto"
          data-scroll-x
          tabIndex={0}
          role="region"
          aria-label="Grille de la semaine"
        >
          <div className={weekend ? "min-w-[58rem]" : "min-w-[45rem]"}>
            <div
              className={cn("grid border-b border-line", cols)}
              aria-hidden="true"
            >
              <span />
              {WEEK_DAYS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "border-l border-line-soft p-3 text-label font-bold",
                    i === TODAY_INDEX ? "bg-brand text-on-brand" : "bg-surface",
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className={cn("grid", cols)}>
              <div
                aria-hidden="true"
                className="relative"
                style={{ height: `${HOUR * (DAY_END - DAY_START)}rem` }}
              >
                {HOURS.map((h) => (
                  <span
                    key={h}
                    className="tabular absolute right-2 text-xs text-ink-muted"
                    style={{ top: `${(h - DAY_START) * HOUR + 0.25}rem` }}
                  >
                    {formatTimeGrid(h)}
                  </span>
                ))}
              </div>
              {TIMETABLE.map((lessons, di) => (
                <section
                  key={di}
                  aria-label={`${WEEK_DAYS[di]}${di === TODAY_INDEX ? " (aujourd'hui)" : ""}`}
                  className="edt-lines relative border-l border-line-soft"
                  style={{ height: `${HOUR * (DAY_END - DAY_START)}rem` }}
                >
                  <ol className="m-0 list-none p-0">
                    {lessons.map((l) => {
                      const s = l.subject;
                      const pos = LANES[di].get(l.id) ?? { lane: 0, of: 1 };
                      return (
                        <li
                          key={l.id}
                          className={cn(
                            "subject absolute flex flex-col gap-px overflow-hidden rounded-[8px] bg-subject-tint px-[0.5625rem] py-1.5",
                            l.cancelled && "opacity-60",
                          )}
                          style={{
                            ...subjectStyle(s.hue),
                            left: `calc(${(pos.lane / pos.of) * 100}% + 4px)`,
                            width: `calc(${100 / pos.of}% - 8px)`,
                            top: `calc(${(l.start - DAY_START) * HOUR}rem + 2px)`,
                            height: `calc(${(l.end - l.start) * HOUR}rem - 4px)`,
                          }}
                        >
                          {clickable(l) && (
                            <button
                              type="button"
                              onClick={() => setSelected(l)}
                              aria-label={`${s.name}${l.group ? ` (${l.group})` : ""}, ${formatTimeText(l.start)} – ${formatTimeText(l.end)}${l.cancelled ? ", annulé" : ""} : ouvrir le cours`}
                              className="absolute inset-0 z-10 cursor-pointer rounded-[8px] hover:bg-ink/5"
                            />
                          )}
                          <span className="sr-only">
                            {formatTimeText(l.start)} – {formatTimeText(l.end)}{" "}
                            :
                          </span>
                          <b
                            className={cn(
                              "text-sm text-subject-ink",
                              l.cancelled && "line-through",
                            )}
                          >
                            {s.name}
                            {l.group && (
                              <span className="ml-1 rounded-[4px] bg-surface px-1 text-xs font-bold text-ink-2">
                                {l.group}
                              </span>
                            )}
                          </b>
                          <span className="text-xs text-ink-2">
                            {showClass && l.className
                              ? `${l.className} · `
                              : ""}
                            {l.room}
                            {l.cancelled && (
                              <b className="text-danger"> · Annulé</b>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      {selected && edit && (
        <LessonDialog
          key={selected.id}
          lesson={selected}
          options={edit}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
