import type { Metadata } from "next";
import { CantineScreen } from "@/components/screens/cantine";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getCanteenAdmin } from "@/lib/data/canteen";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Gestion de la cantine" };

export default async function Page({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const profile = await requireModule("cantine");
  const { semaine } = await searchParams;
  const today = isoDay(now());
  const weekOf = /^\d{4}-\d{2}-\d{2}$/.test(semaine ?? "") ? semaine! : today;
  const sections = await getSections(profile, "cantine");
  const data = await Promise.all(sections.map(({ viewer, supabase }) => getCanteenAdmin(supabase, viewer, weekOf)));
  return (
    <AppShell profile={profile} module="cantine">
      <Sections sections={sections} render={(_, i) => <CantineScreen data={data[i]} today={today} />} />
    </AppShell>
  );
}
