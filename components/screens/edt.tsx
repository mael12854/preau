import { cn } from "@/lib/cn";
import { formatTimeGrid, formatTimeText } from "@/lib/format";
import { DAY_END, DAY_START, SUBJECTS, TIMETABLE, TODAY_INDEX, WEEK_DAYS } from "@/lib/mock";
import { subjectStyle } from "@/lib/subjects";

const HOUR = 3.75; // rem par heure (60 px)
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

/** Emploi du temps : grille semaine 8 h – 17 h, jour courant en vert, cours annulé barré. */
export function EdtScreen() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {/* La grille 2D défile horizontalement sur petit écran (exception de redistribution RGAA). */}
      <div className="overflow-x-auto" data-scroll-x tabIndex={0} role="region" aria-label="Grille de la semaine">
        <div className="min-w-[45rem]">
          <div className="grid grid-cols-[3.5rem_repeat(5,1fr)] border-b border-line" aria-hidden="true">
            <span />
            {WEEK_DAYS.map((d, i) => (
              <div key={d} className={cn("border-l border-line-soft p-3 text-label font-bold", i === TODAY_INDEX ? "bg-brand text-on-brand" : "bg-surface")}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[3.5rem_repeat(5,1fr)]">
            <div aria-hidden="true" className="relative" style={{ height: `${HOUR * (DAY_END - DAY_START)}rem` }}>
              {HOURS.map((h) => (
                <span key={h} className="tabular absolute right-2 text-xs text-ink-muted" style={{ top: `${(h - DAY_START) * HOUR + 0.25}rem` }}>
                  {formatTimeGrid(h)}
                </span>
              ))}
            </div>
            {TIMETABLE.map((lessons, di) => (
              <section key={di} aria-label={`${WEEK_DAYS[di]}${di === TODAY_INDEX ? " (aujourd'hui)" : ""}`} className="edt-lines relative border-l border-line-soft" style={{ height: `${HOUR * (DAY_END - DAY_START)}rem` }}>
                <ol className="m-0 list-none p-0">
                  {lessons.map((l) => {
                    const s = SUBJECTS[l.subject];
                    return (
                      <li
                        key={l.start}
                        className={cn("subject absolute inset-x-1 flex flex-col gap-px overflow-hidden rounded-[8px] bg-subject-tint px-[0.5625rem] py-1.5", l.cancelled && "opacity-60")}
                        style={{ ...subjectStyle(s.hue), top: `calc(${(l.start - DAY_START) * HOUR}rem + 2px)`, height: `calc(${(l.end - l.start) * HOUR}rem - 4px)` }}
                      >
                        <span className="sr-only">
                          {formatTimeText(l.start)} – {formatTimeText(l.end)} :
                        </span>
                        <b className={cn("text-sm text-subject-ink", l.cancelled && "line-through")}>{s.name}</b>
                        <span className="text-xs text-ink-2">
                          {l.room}
                          {l.cancelled && <b className="text-danger"> · Annulé</b>}
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
  );
}
