"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/choice";
import { Icon } from "@/components/ui/icon";
import { SubjectChip } from "@/components/ui/subject-chip";
import { cn } from "@/lib/cn";
import type { HomeworkDayView } from "@/lib/data/types";
import { useDone } from "@/lib/use-done";

/**
 * Devoirs, groupés par jour d'échéance. La coche « fait » est personnelle :
 * le professeur (« Cahier de textes ») ne la voit pas.
 */
export function DevoirsScreen({ staff, days, initialDone }: { staff: boolean; days: HomeworkDayView[]; initialDone: string[] }) {
  const [done, toggle] = useDone(initialDone);
  const all = days.flatMap((d) => d.items);
  const n = all.filter((h) => done.includes(h.id)).length;
  const pct = all.length ? Math.round((n / all.length) * 100) : 0;

  if (all.length === 0) {
    return <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucun devoir à venir.</p>;
  }

  return (
    <div className={cn("grid items-start gap-5", !staff && "lg:grid-cols-[minmax(0,1fr)_17.5rem]")}>
      <div className="flex min-w-0 flex-col gap-6">
        {days.map((day) => (
          <section key={day.day} aria-labelledby={`jour-${day.items[0].id}`} className="flex flex-col gap-2.5">
            <h2 id={`jour-${day.items[0].id}`} className="m-0 font-display text-h3 font-bold">
              {day.day}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {day.items.map((h) => {
                const s = h.subject;
                const isDone = done.includes(h.id);
                return (
                  <li key={h.id} className="flex flex-wrap items-start gap-3.5 rounded-card border border-line bg-surface px-[1.125rem] py-4 sm:flex-nowrap">
                    {!staff && (
                      <Checkbox
                        size={26}
                        checked={isDone}
                        onCheckedChange={() => toggle(h.id)}
                        aria-label={`Marquer comme fait : ${s.name}, ${h.text}`}
                      />
                    )}
                    <div className="flex min-w-0 flex-1 basis-56 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <SubjectChip name={s.name} hue={s.hue} />
                        {h.exam && <Badge tone="inverse" className="text-xs">Contrôle</Badge>}
                        {staff && h.className && <span className="text-meta text-ink-muted">{h.className}</span>}
                      </div>
                      <p className={cn("m-0 text-lg", isDone && !staff ? "text-ink-muted line-through" : "text-ink")}>{h.text}</p>
                      {h.file && (
                        <a href="#" onClick={(e) => e.preventDefault()} className="flex w-fit min-h-11 items-center gap-1.5 text-sm font-bold no-underline hover:underline -my-2">
                          <Icon name="attach_file" size={18} />
                          {h.file}
                          <span className="sr-only"> (pièce jointe)</span>
                        </a>
                      )}
                    </div>
                    <span className="text-meta text-ink-muted">Donné le {h.given}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!staff && (
        <aside aria-labelledby="hw-week" className="flex flex-col gap-3.5 rounded-card border border-line bg-surface p-5 lg:sticky lg:top-6">
          <h2 id="hw-week" className="m-0 font-display text-h3 font-bold">
            Cette semaine
          </h2>
          <p className="m-0 font-display text-hello font-extrabold tracking-[-0.03em]" aria-live="polite">
            {n}
            <span className="text-h2 text-ink-muted"> / {all.length}</span>
          </p>
          <div role="progressbar" aria-label="Devoirs faits cette semaine" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-neutral-bg">
            <div className="h-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="m-0 text-sm text-ink-2">devoirs marqués comme faits. Cette coche est personnelle, le professeur ne la voit pas.</p>
        </aside>
      )}
    </div>
  );
}
