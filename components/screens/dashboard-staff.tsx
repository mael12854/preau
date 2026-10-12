import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { StaffDashboard as StaffDashboardData } from "@/lib/mock/staff";
import type { Viewer } from "@/lib/session";
import { DemoActionButton } from "./demo-action";
import { Greeting, Stat } from "./greeting";

/** Tableau de bord du personnel : 3 indicateurs, liste du jour, « À traiter ». */
export function StaffDashboard({ profile, data }: { profile: Viewer; data: StaffDashboardData }) {
  return (
    <div className="flex flex-col gap-6">
      <Greeting hello={profile.hello} />
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
        {data.kpis.map((k) => (
          <li key={k.label}>
            <Card as="div" className="flex h-full flex-col gap-1.5">
              <Stat value={k.value} label={k.label} tone={k.tone} size="lg" />
            </Card>
          </li>
        ))}
      </ul>
      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card aria-labelledby="staff-list" className="@container flex flex-col gap-1">
          <h2 id="staff-list" className="m-0 mb-2.5 font-display text-card font-bold">
            {data.listTitle}
          </h2>
          <ul className="m-0 list-none p-0">
            {data.list.map((r) => (
              <li key={r.time + r.title} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 border-t border-line-soft py-3 @lg:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto]">
                <span className="tabular text-caption text-ink-muted">{r.time}</span>
                <div className="flex flex-col">
                  <b className="text-ui">{r.title}</b>
                  <span className="text-caption text-ink-muted">{r.sub}</span>
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-3 @lg:contents">
                  <Badge tone={r.tone}>{r.status}</Badge>
                  {r.action &&
                    (r.href ? (
                      <Button asChild size="sm">
                        <Link href={r.href}>{r.action}</Link>
                      </Button>
                    ) : (
                      <DemoActionButton label={r.action} message={r.done ?? r.action} />
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card aria-labelledby="staff-todo" className="flex flex-col gap-3">
          <h2 id="staff-todo" className="m-0 font-display text-card font-bold">
            À traiter
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {data.todo.map((t) => (
              <li key={t.title} className="flex items-start gap-3 rounded-control bg-bg p-3">
                <Icon name={t.icon} size={22} className="text-brand" />
                <div className="flex flex-col gap-0.5">
                  <b className="text-ui">{t.title}</b>
                  <span className="text-caption text-ink-muted">{t.sub}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
