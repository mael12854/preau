import type { Metadata } from "next";
import { AgendaScreen } from "@/components/screens/agenda";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getAgenda } from "@/lib/data/school";
import { getPublishTargets, isManager } from "@/lib/data/targets";
import { isoDay, paris } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Agenda" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const profile = await requireModule("agenda");
  const { mois } = await searchParams;
  const reference = now();
  const match = /^(\d{4})-(\d{2})$/.exec(mois ?? "");
  const p = paris(reference);
  const year = match ? Number(match[1]) : p.year;
  const month = match ? Math.min(11, Math.max(0, Number(match[2]) - 1)) : p.month;
  const sections = await getSections(profile, "agenda");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) =>
      Promise.all([
        getAgenda(supabase, year, month, viewer.profileId, isManager(viewer)),
        getPublishTargets(supabase, viewer),
      ]),
    ),
  );
  return (
    <AppShell profile={profile} module="agenda">
      <Sections
        sections={sections}
        render={(_, i) => (
          <AgendaScreen year={year} month={month} today={isoDay(reference)} events={data[i][0]} targets={data[i][1]} />
        )}
      />
    </AppShell>
  );
}
