"use client";

import { useRouter } from "next/navigation";
import { TONE_CLASSES } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { PublishTargets } from "@/lib/data/targets";
import type { AgendaEventView } from "@/lib/data/types";
import { AddAgendaEvent, AgendaEventList } from "./agenda-editor";
import { formatDateLong, formatMonth } from "@/lib/format";

const DAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const DAYS_LONG = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

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

function firstWeekday(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return localIso(d);
}

const localIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Agenda : vue mois, événements colorés, jour courant. Les mois voisins sont chargés par l'URL. */
export function AgendaScreen({
  year,
  month,
  today,
  events,
  targets,
}: {
  year: number;
  month: number;
  today: string;
  events: AgendaEventView[];
  targets?: PublishTargets | null;
}) {
  const router = useRouter();
  const weeks = monthCells(year, month);
  const title = formatMonth(year, month);

  return (
    <div className="flex flex-col gap-4">
      {targets && (
        <div className="flex justify-end">
          <AddAgendaEvent
            targets={targets}
            defaultDay={
              today.slice(0, 7) ===
              `${year}-${String(month + 1).padStart(2, "0")}`
                ? today
                : `${year}-${String(month + 1).padStart(2, "0")}-01`
            }
          />
        </div>
      )}
      <section
        aria-labelledby="agenda-title"
        className="overflow-hidden rounded-card border border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2
            id="agenda-title"
            className="m-0 font-display text-h2 font-bold"
            aria-live="polite"
          >
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
                onClick={() => {
                  const d = new Date(year, month + b.d, 1);
                  router.push(
                    `/agenda?mois=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
                className="relative flex size-9 items-center justify-center rounded-[9px] border border-line hover:border-line-strong after:absolute after:-inset-1 after:content-['']"
              >
                <Icon name={b.icon} />
              </button>
            ))}
          </div>
        </div>
        <div
          className="relative overflow-x-auto"
          data-scroll-x
          tabIndex={0}
          role="region"
          aria-label={`Calendrier de ${title}`}
        >
          <table className="w-full min-w-[42rem] table-fixed border-collapse">
            <caption className="sr-only">Calendrier de {title}</caption>
            <thead>
              <tr className="border-b border-line">
                {DAYS.map((d, i) => (
                  <th
                    key={d}
                    scope="col"
                    className="px-3 py-2 text-left text-meta font-normal text-ink-muted"
                  >
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
                    const iso = localIso(date);
                    const isToday = iso === today;
                    const holidayEvent = events.find(
                      (e) =>
                        e.holiday &&
                        e.startsOn <= iso &&
                        (e.endsOn ?? e.startsOn) >= iso,
                    );
                    const holiday = inMonth && !!holidayEvent;
                    // Un congé s'affiche sur son premier jour de semaine ; les autres événements sur leur date.
                    const dayEvents = inMonth
                      ? events.filter((e) =>
                          e.holiday
                            ? firstWeekday(e.startsOn) === iso
                            : e.startsOn === iso,
                        )
                      : [];
                    return (
                      <td
                        key={di}
                        aria-current={isToday ? "date" : undefined}
                        className={cn(
                          "h-26 border-r border-b border-line-soft p-2 align-top last:border-r-0",
                          holiday
                            ? "bg-calendar-off"
                            : di >= 5
                              ? "bg-surface-2"
                              : "bg-surface",
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "flex h-[1.625rem] min-w-[1.625rem] items-center justify-center self-start rounded-full text-sm font-bold",
                              isToday
                                ? "bg-brand text-on-brand"
                                : inMonth
                                  ? "text-ink"
                                  : "font-normal text-ink-muted",
                            )}
                          >
                            <span aria-hidden="true">{n}</span>
                            <span className="sr-only">
                              {formatDateLong(date)}
                            </span>
                          </span>
                          {dayEvents.map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                "rounded-[5px] px-1.5 py-[0.1875rem] text-xs leading-[1.3] font-bold",
                                TONE_CLASSES[e.tone],
                              )}
                            >
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
      <AgendaEventList events={events} />
    </div>
  );
}
