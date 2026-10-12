"use client";

import { useState } from "react";
import { Badge, TONE_CLASSES } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { SCHOOL_LIFE_EVENTS, SCHOOL_LIFE_STATS } from "@/lib/mock";
import { Stat } from "./greeting";
import { JustifyButton } from "./justify-dialog";

/** Vie scolaire : 4 compteurs, événements avec statut et « Justifier ». */
export function VieScolaireScreen() {
  const [justified, setJustified] = useState<number[]>([]);
  return (
    <div className="flex flex-col gap-5">
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {SCHOOL_LIFE_STATS.map((s) => (
          <li key={s.label} className="flex flex-col rounded-card border border-line bg-surface p-[1.125rem]">
            <Stat value={s.value} label={s.label} tone={s.positive ? "ok" : undefined} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="viesco-events" className="overflow-hidden rounded-card border border-line bg-surface">
        <h2 id="viesco-events" className="sr-only">
          Événements
        </h2>
        <ul className="m-0 list-none p-0">
          {SCHOOL_LIFE_EVENTS.map((e, i) => {
            const done = justified.includes(i);
            return (
              <li
                key={e.type + e.date}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0 md:grid-cols-[2.75rem_10rem_minmax(0,1fr)_8.125rem_7.5rem]"
              >
                <span aria-hidden="true" className={cn("flex size-10 items-center justify-center rounded-control", TONE_CLASSES[e.tone])}>
                  <Icon name={e.icon} size={22} />
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-ui font-bold">{e.type}</h3>
                  <span className="text-caption text-ink-muted">{e.date}</span>
                </div>
                <span className="col-start-2 text-ui text-ink-2 md:col-start-auto">{e.detail}</span>
                <div className="col-start-2 md:col-start-auto">
                  <Badge tone={done ? "info" : e.statusTone}>{done ? "Justificatif envoyé" : e.status}</Badge>
                </div>
                <div className="col-start-2 md:col-start-auto">
                  {e.canJustify && !done && <JustifyButton what={`${e.type} · ${e.date}`} onJustified={() => setJustified((j) => [...j, i])} />}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
