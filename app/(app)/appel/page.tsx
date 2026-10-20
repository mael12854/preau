import type { Metadata } from "next";
import { AppelScreen } from "@/components/screens/appel";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getAppel } from "@/lib/data/teacher";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Appel & évaluation" };

export default async function AppelPage() {
  const profile = await requireModule("saisie");
  const sections = await getSections(profile, "saisie");
  const data = await Promise.all(sections.map((s) => getAppel(s.supabase, s.viewer.profileId, now())));
  return (
    <AppShell profile={profile} module="saisie">
      <Sections
        sections={sections}
        render={(s, i) => <AppelScreen data={data[i]} scale={s.viewer.scale} grading={s.viewer.grading} />}
      />
    </AppShell>
  );
}
