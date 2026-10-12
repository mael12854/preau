"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { HomeworkDayView } from "@/lib/data/types";
import { subjectStyle } from "@/lib/subjects";
import { useDone } from "@/lib/use-done";

/** Prochains devoirs, cochables (tableau de bord). */
export function TomorrowHomework({ headingId, day, title, initialDone }: { headingId: string; day: HomeworkDayView | null; title: string; initialDone: string[] }) {
  const [done, toggle] = useDone(initialDone);
  const items = day?.items ?? [];
  const n = items.filter((h) => done.includes(h.id)).length;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="m-0 font-display text-card font-bold">
          {title}
        </h2>
        {items.length > 0 && (
          <span className="text-caption text-ink-muted" aria-live="polite">
            {n} / {items.length} faits
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="m-0 text-ui text-ink-2">Aucun devoir pour demain.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((h) => {
            const isDone = done.includes(h.id);
            return (
              <li key={h.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  onClick={() => toggle(h.id)}
                  className="flex w-full items-start gap-3 rounded-control border border-line bg-surface p-3 text-left hover:border-line-strong"
                >
                  <span
                    aria-hidden="true"
                    className={cn("flex size-[1.375rem] shrink-0 items-center justify-center rounded-[6px] text-on-brand", isDone ? "bg-brand" : "border-[1.5px] border-line-strong")}
                  >
                    {isDone && <Icon name="check" size={18} />}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="subject text-caption font-bold text-subject-ink" style={subjectStyle(h.subject.hue)}>
                      {h.subject.name}
                    </span>
                    <span className={cn("text-ui", isDone ? "text-ink-muted line-through" : "text-ink")}>{h.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
