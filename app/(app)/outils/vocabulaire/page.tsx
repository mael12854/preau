import type { Metadata } from "next";
import { VocabulaireScreen } from "@/components/screens/vocabulaire";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getVocabDecks, teachingClasses } from "@/lib/data/tools";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Cartes de vocabulaire" };

export default async function Page() {
  const profile = await requireModule("outils");
  const sections = await getSections(profile, "outils");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) => Promise.all([getVocabDecks(supabase, viewer), teachingClasses(supabase, viewer)])),
  );
  return (
    <AppShell profile={profile} module="outils">
      <Sections
        sections={sections}
        render={(s, i) => (
          <VocabulaireScreen
            decks={data[i][0]}
            classes={data[i][1]}
            staff={s.viewer.staff}
            student={!!s.viewer.student && s.viewer.id !== "parent" && s.viewer.id !== "parent-primaire"}
            today={isoDay(now())}
          />
        )}
      />
    </AppShell>
  );
}
