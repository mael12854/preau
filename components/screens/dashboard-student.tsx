import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Counter } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PastilleDot } from "@/components/ui/pastille";
import { cn } from "@/lib/cn";
import type { HomeworkDayView, LastEvaluationView, LessonView, LifeStatsView, MessageView } from "@/lib/data/types";
import { EVAL_META } from "@/lib/evaluation";
import { formatTimeGrid } from "@/lib/format";
import type { Viewer } from "@/lib/session";
import { subjectStyle } from "@/lib/subjects";
import { ChildSelector } from "./child-selector";
import { Greeting } from "./greeting";
import { TomorrowHomework } from "./homework-check";

const linkAction = cn(buttonClasses("tertiary", "sm"), "-mr-2 px-2 text-label");

function CardTitle({ id, children, action }: { id: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="m-0 font-display text-card font-bold">
        {children}
      </h2>
      {action}
    </div>
  );
}

export type StudentDashboardData = {
  today: LessonView[];
  next: HomeworkDayView | null;
  nextTitle: string;
  done: string[];
  lastEvaluations: LastEvaluationView[];
  stats: LifeStatsView;
  toJustify: string | null;
  unread: number;
  messages: MessageView[];
};

/** Tableau de bord élève (collège, lycée) et parent. */
export function StudentDashboard({ profile, data }: { profile: Viewer; data: StudentDashboardData }) {
  const { today } = data;
  return (
    <div className="flex flex-col gap-6">
      <Greeting
        hello={profile.hello}
        aside={profile.id === "parent" && profile.student ? <ChildSelector student={profile.student} /> : undefined}
      />

      {data.stats.toJustify > 0 && (
        <Alert
          tone="danger"
          title={data.stats.toJustify > 1 ? `${data.stats.toJustify} absences à justifier` : "1 absence à justifier"}
          action={
            <Button asChild variant="danger" size="sm">
              <Link href="/vie-scolaire">Justifier</Link>
            </Button>
          }
        >
          {data.toJustify && <>— {data.toJustify}.</>}
        </Alert>
      )}

      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Card aria-labelledby="dash-today" className="flex flex-col gap-3.5 xl:row-span-2">
          <CardTitle id="dash-today" action={<Link href="/emploi-du-temps" className={linkAction}>Semaine</Link>}>
            Aujourd&apos;hui
          </CardTitle>
          {today.length === 0 && <p className="m-0 text-ui text-ink-2">Aucun cours aujourd&apos;hui.</p>}
          <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
            {today.map((l) => {
              const s = l.subject;
              const now = l.now;
              return (
                <li key={l.id} className="grid grid-cols-[3rem_1fr] items-stretch gap-3" aria-current={now ? "time" : undefined}>
                  <span className="tabular pt-2.5 text-caption text-ink-muted">{formatTimeGrid(l.start)}</span>
                  <div
                    className={cn("subject flex flex-col gap-0.5 rounded-control bg-subject-tint px-3 py-2.5", now && "outline-2 outline-offset-2 outline-ink outline-solid")}
                    style={subjectStyle(s.hue)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-ui text-subject-ink">{s.name}</b>
                      {now && <span className="rounded-[5px] bg-inverse px-1.5 py-0.5 text-2xs font-bold text-on-inverse">En cours</span>}
                    </div>
                    <span className="text-caption text-ink-2">
                      {l.room} · {l.teacher}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card aria-labelledby="dash-tomorrow" className="flex flex-col gap-3">
          <TomorrowHomework headingId="dash-tomorrow" day={data.next} title={data.nextTitle} initialDone={data.done} />
        </Card>

        <Card aria-labelledby="dash-evals" className="flex flex-col gap-3">
          <CardTitle id="dash-evals" action={<Link href="/evaluations" className={linkAction}>Tout voir</Link>}>
            Dernières évaluations
          </CardTitle>
          {data.lastEvaluations.length === 0 && <p className="m-0 text-ui text-ink-2">Aucune évaluation publiée pour l&apos;instant.</p>}
          <ul className="m-0 flex list-none flex-col p-0">
            {data.lastEvaluations.map((e) => {
              return (
                <li key={e.id} className="flex items-center gap-3 border-b border-line-soft py-1.5 last:border-b-0">
                  <PastilleDot value={e.level} size={20} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <b className="text-label">{e.title}</b>
                    <span className="text-caption text-ink-muted">
                      {e.subject} · {e.date}
                    </span>
                  </div>
                  <span className="text-right text-caption text-ink-2">{EVAL_META[e.level].label}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card aria-labelledby="dash-viesco" className="flex flex-col gap-3">
          <CardTitle id="dash-viesco">Vie scolaire</CardTitle>
          <dl className="m-0 grid grid-cols-2 gap-2.5">
            {[
              [String(data.stats.absences), data.stats.absences > 1 ? "absences" : "absence"],
              [String(data.stats.lates), data.stats.lates > 1 ? "retards" : "retard"],
            ].map(([v, l]) => (
              <div key={l} className="flex flex-col-reverse rounded-control bg-bg p-3">
                <dt className="text-caption text-ink-2">{l}</dt>
                <dd className="m-0 font-display text-stat font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card aria-labelledby="dash-messages" className="flex flex-col gap-3">
          <CardTitle id="dash-messages" action={data.unread > 0 ? <Counter count={data.unread} label={`${data.unread} messages non lus`} /> : undefined}>
            <Link href="/messagerie" className="text-ink no-underline hover:underline">
              Messages
            </Link>
          </CardTitle>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {data.messages.length === 0 && <li className="text-ui text-ink-2">Aucun message.</li>}
            {data.messages.slice(0, 2).map((m) => (
              <li key={m.id} className="flex flex-col gap-0.5 text-label">
                <b>{m.from}</b>
                <span className="text-ink-2">{m.subject}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
