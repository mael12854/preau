import type { Metadata } from "next";
import { VieScolaireScreen } from "@/components/screens/viesco";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { getLifeEvents } from "@/lib/data/school-life";
import { isAdminStaff } from "@/lib/data/targets";
import { getSections, requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vie scolaire" };

export default async function VieScolairePage() {
  const profile = await requireModule("viesco");
  // Familles : leur enfant, justification envoyée à l'établissement.
  if (!profile.staff) {
    const supabase = await createClient();
    const { events, stats } = await getLifeEvents(supabase, profile.student?.id ?? null, true);
    return (
      <AppShell profile={profile} module="viesco">
        <VieScolaireScreen events={events} stats={stats} />
      </AppShell>
    );
  }
  // Personnel : les élèves visibles (ses classes pour un professeur). Vie scolaire, direction et secrétariat
  // justifient et examinent les justificatifs ; le professeur consulte.
  const sections = await getSections(profile, "viesco");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) => getLifeEvents(supabase, null, isAdminStaff(viewer), isAdminStaff(viewer))),
  );
  return (
    <AppShell profile={profile} module="viesco">
      <Sections
        sections={sections}
        render={(s, i) => (
          <VieScolaireScreen events={data[i].events} stats={data[i].stats} staff canValidate={isAdminStaff(s.viewer)} />
        )}
      />
    </AppShell>
  );
}
