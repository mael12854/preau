"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { HOMEWORK } from "@/lib/mock/devoirs";
import { SUBJECTS } from "@/lib/mock/subjects";
import { subjectStyle } from "@/lib/subjects";
import { useHomeworkDone } from "@/lib/use-homework";

/** Devoirs du lendemain, cochables (tableau de bord). */
export function TomorrowHomework({ headingId }: { headingId: string }) {
  const [done, toggle] = useHomeworkDone();
  const items = HOMEWORK[0].items;
  const n = items.filter((h) => done.includes(h.id)).length;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="m-0 font-display text-card font-bold">
          Pour demain
        </h2>
        <span className="text-caption text-ink-muted" aria-live="polite">
          {n} / {items.length} faits
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {items.map((h) => {
          const s = SUBJECTS[h.subject];
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
                  className={cn(
                    "flex size-[1.375rem] shrink-0 items-center justify-center rounded-[6px] text-on-brand",
                    isDone ? "bg-brand" : "border-[1.5px] border-line-strong",
                  )}
                >
                  {isDone && <Icon name="check" size={18} />}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="subject text-caption font-bold text-subject-ink" style={subjectStyle(s.hue)}>
                    {s.name}
                  </span>
                  <span className={cn("text-ui", isDone ? "text-ink-muted line-through" : "text-ink")}>{h.text}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
