import type { Metadata } from "next";
import { VieScolaireScreen } from "@/components/screens/viesco";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Vie scolaire" };

export default async function VieScolairePage() {
  const profile = await requireModule("viesco");
  return (
    <AppShell profile={profile} module="viesco">
      <VieScolaireScreen />
    </AppShell>
  );
}
