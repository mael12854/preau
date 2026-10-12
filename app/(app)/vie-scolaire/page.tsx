import type { Metadata } from "next";
import { VieScolaireScreen } from "@/components/screens/viesco";
import { AppShell } from "@/components/shell/app-shell";
import { getLifeEvents } from "@/lib/data/school-life";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vie scolaire" };

export default async function VieScolairePage() {
  const profile = await requireModule("viesco");
  const supabase = await createClient();
  // La famille et la vie scolaire peuvent justifier ; la direction consulte.
  const canJustify = !profile.staff || profile.id === "cpe";
  const { events, stats } = await getLifeEvents(supabase, profile.student?.id ?? null, canJustify);
  return (
    <AppShell profile={profile} module="viesco">
      <VieScolaireScreen events={events} stats={stats} />
    </AppShell>
  );
}
