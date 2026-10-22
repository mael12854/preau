import type { Metadata } from "next";
import { AppelScreen } from "@/components/screens/appel";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getHomeworkChoices } from "@/lib/data/homework";
import { getAppel } from "@/lib/data/teacher";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Appel & évaluation" };

export default async function AppelPage({ searchParams }: { searchParams: Promise<{ evaluation?: string; cours?: string }> }) {
  const profile = await requireModule("saisie");
  const { evaluation, cours } = await searchParams;
  const reference = now();
  const sections = await getSections(profile, "saisie");
  const [data, choices] = await Promise.all([
    Promise.all(sections.map((s) => getAppel(s.supabase, s.viewer.profileId, reference, evaluation, cours))),
    Promise.all(sections.map((s) => getHomeworkChoices(s.supabase, s.viewer.profileId, reference))),
  ]);
  return (
    <AppShell profile={profile} module="saisie">
      <Sections
        sections={sections}
        render={(s, i) => (
          <AppelScreen
            data={data[i]}
            choices={choices[i]}
            today={isoDay(reference)}
            scale={s.viewer.scale}
            grading={s.viewer.grading}
            initialTab={evaluation ? "eval" : "appel"}
          />
        )}
      />
    </AppShell>
  );
}
