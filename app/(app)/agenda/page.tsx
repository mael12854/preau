import type { Metadata } from "next";
import { AgendaScreen } from "@/components/screens/agenda";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getAgenda } from "@/lib/data/school";
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
  const events = await getAgenda(await createClient(), year, month);
  return (
    <AppShell profile={profile} module="agenda">
      <AgendaScreen year={year} month={month} today={isoDay(reference)} events={events} />
    </AppShell>
  );
}
