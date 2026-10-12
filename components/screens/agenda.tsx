"use client";

import { useState } from "react";
import { TONE_CLASSES } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatDateLong, formatMonth } from "@/lib/format";
import { AGENDA_EVENTS, AGENDA_MONTH, HOLIDAYS_FROM, TODAY } from "@/lib/mock";

const DAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const DAYS_LONG = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

type Cell = { date: Date; inMonth: boolean };

function monthCells(year: number, month: number): Cell[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + days) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(year, month, 1 - offset + w * 7 + d);
      return { date, inMonth: date.getMonth() === month };
    }),
  );
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Agenda : vue mois, événements colorés, jour courant. */
export function AgendaScreen() {
  const [shift, setShift] = useState(0);
  const ref = new Date(AGENDA_MONTH.year, AGENDA_MONTH.month + shift, 1);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const isRef = shift === 0;
  const weeks = monthCells(year, month);
  const title = formatMonth(year, month);

  return (
    <section aria-labelledby="agenda-title" className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="agenda-title" className="m-0 font-display text-h2 font-bold" aria-live="polite">
          {title}
        </h2>
        <div className="flex gap-1.5">
          {[
            { d: -1, icon: "chevron_left" as const, label: "Mois précédent" },
            { d: 1, icon: "chevron_right" as const, label: "Mois suivant" },
          ].map((b) => (
            <button
              key={b.d}
              type="button"
              aria-label={b.label}
              onClick={() => setShift((s) => s + b.d)}
              className="relative flex size-9 items-center justify-center rounded-[9px] border border-line hover:border-line-strong after:absolute after:-inset-1 after:content-['']"
            >
              <Icon name={b.icon} />
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-x-auto" data-scroll-x tabIndex={0} role="region" aria-label={`Calendrier de ${title}`}>
        <table className="w-full min-w-[42rem] table-fixed border-collapse">
          <caption className="sr-only">Calendrier de {title}</caption>
          <thead>
            <tr className="border-b border-line">
              {DAYS.map((d, i) => (
                <th key={d} scope="col" className="px-3 py-2 text-left text-meta font-normal text-ink-muted">
                  <abbr title={DAYS_LONG[i]} className="no-underline">
                    {d}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map(({ date, inMonth }, di) => {
                  const n = date.getDate();
                  const events = inMonth && isRef ? (AGENDA_EVENTS[n] ?? []) : [];
                  const today = sameDay(date, TODAY);
                  const holiday = inMonth && isRef && n >= HOLIDAYS_FROM;
                  return (
                    <td
                      key={di}
                      aria-current={today ? "date" : undefined}
                      className={cn(
                        "h-26 border-r border-b border-line-soft p-2 align-top last:border-r-0",
                        holiday ? "bg-calendar-off" : di >= 5 ? "bg-surface-2" : "bg-surface",
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "flex h-[1.625rem] min-w-[1.625rem] items-center justify-center self-start rounded-full text-sm font-bold",
                            today ? "bg-brand text-on-brand" : inMonth ? "text-ink" : "font-normal text-ink-muted",
                          )}
                        >
                          <span aria-hidden="true">{n}</span>
                          <span className="sr-only">{formatDateLong(date)}</span>
                        </span>
                        {events.map((e) => (
                          <span key={e.title} className={cn("rounded-[5px] px-1.5 py-[0.1875rem] text-xs leading-[1.3] font-bold", TONE_CLASSES[e.tone])}>
                            {e.title}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
