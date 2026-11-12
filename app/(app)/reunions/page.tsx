import type { Metadata } from "next";
import { MeetingsScreen } from "@/components/screens/reunions";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getMeetings } from "@/lib/data/meetings";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Réunions parents-profs" };

export default async function Page() {
  const profile = await requireModule("reunions");
  const sections = await getSections(profile, "reunions");
  const data = await Promise.all(sections.map(({ viewer, supabase }) => getMeetings(supabase, viewer)));
  return (
    <AppShell profile={profile} module="reunions">
      <Sections sections={sections} render={(s, i) => <MeetingsScreen {...data[i]} staff={s.viewer.staff} today={isoDay(now())} />} />
    </AppShell>
  );
}
