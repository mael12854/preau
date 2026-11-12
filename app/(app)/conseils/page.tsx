import type { Metadata } from "next";
import { CouncilsScreen } from "@/components/screens/conseils";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getCouncils } from "@/lib/data/councils";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Conseils de classe" };

export default async function Page() {
  const profile = await requireModule("conseils");
  const sections = await getSections(profile, "conseils");
  const data = await Promise.all(sections.map(({ viewer, supabase }) => getCouncils(supabase, viewer)));
  return (
    <AppShell profile={profile} module="conseils">
      <Sections sections={sections} render={(_, i) => <CouncilsScreen {...data[i]} today={isoDay(now())} />} />
    </AppShell>
  );
}
