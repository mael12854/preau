import type { Metadata } from "next";
import { AgendaScreen } from "@/components/screens/agenda";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getAgenda } from "@/lib/data/school";
import { getPublishTargets, isManager } from "@/lib/data/targets";
import { isoDay, paris } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agenda" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const profile = await requireModule("agenda");
  const { mois } = await searchParams;
  const reference = now();
  const match = /^(\d{4})-(\d{2})$/.exec(mois ?? "");
  const p = paris(reference);
  const year = match ? Number(match[1]) : p.year;
  const month = match ? Math.min(11, Math.max(0, Number(match[2]) - 1)) : p.month;
  const supabase = await createClient();
  const [events, targets] = await Promise.all([
    getAgenda(supabase, year, month, profile.profileId, isManager(profile)),
    getPublishTargets(supabase, profile),
  ]);
  return (
    <AppShell profile={profile} module="agenda">
      <AgendaScreen year={year} month={month} today={isoDay(reference)} events={events} targets={targets} />
    </AppShell>
  );
}
