import { Badge, TONE_CLASSES } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { LifeEventView, LifeStatsView } from "@/lib/data/types";
import { Stat } from "./greeting";
import { JustifyButton } from "./justify-dialog";

/** Vie scolaire : 4 compteurs, événements avec statut et « Justifier ». */
const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function VieScolaireScreen({ events, stats }: { events: LifeEventView[]; stats: LifeStatsView }) {
  const SCHOOL_LIFE_STATS = [
    { value: String(stats.absences), label: `${plural(stats.absences, "Absence", "Absences")}${stats.toJustify ? ` · ${stats.toJustify} à justifier` : ""}` },
    { value: String(stats.lates), label: `${plural(stats.lates, "Retard", "Retards")}${stats.lateMinutes ? ` · ${stats.lateMinutes} min au total` : ""}` },
    { value: String(stats.sanctions), label: plural(stats.sanctions, "Sanction", "Sanctions") },
    { value: String(stats.encouragements), label: plural(stats.encouragements, "Encouragement", "Encouragements"), positive: stats.encouragements > 0 },
  ];
  return (
    <div className="flex flex-col gap-5">
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {SCHOOL_LIFE_STATS.map((s) => (
          <li key={s.label} className="flex flex-col rounded-card border border-line bg-surface p-[1.125rem]">
            <Stat value={s.value} label={s.label} tone={s.positive ? "ok" : undefined} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="viesco-events" className="@container overflow-hidden rounded-card border border-line bg-surface">
        <h2 id="viesco-events" className="sr-only">
          Événements
        </h2>
        {events.length === 0 && <p className="m-0 px-5 py-10 text-center text-ui text-ink-2">Aucun événement pour l&apos;instant.</p>}
        <ul className="m-0 list-none p-0">
          {events.map((e) => {
            return (
              <li
                key={e.id}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-4 last:border-b-0 @3xl:grid-cols-[2.75rem_10rem_minmax(0,1fr)_8.125rem_7.5rem]"
              >
                <span aria-hidden="true" className={cn("flex size-10 items-center justify-center rounded-control", TONE_CLASSES[e.tone])}>
                  <Icon name={e.icon} size={22} />
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-ui font-bold">
                    {e.type}
                    {e.student && <span className="font-normal text-ink-2"> · {e.student}</span>}
                  </h3>
                  <span className="text-caption text-ink-muted">{e.date}</span>
                </div>
                <span className="col-start-2 text-ui text-ink-2 @3xl:col-start-auto">{e.detail}</span>
                <div className="col-start-2 @3xl:col-start-auto">
                  <Badge tone={e.statusTone}>{e.status}</Badge>
                </div>
                <div className="col-start-2 @3xl:col-start-auto">
                  {e.canJustify && <JustifyButton eventId={e.id} what={`${e.type} · ${e.date}`} />}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
