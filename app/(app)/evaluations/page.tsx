import type { Metadata } from "next";
import { EvaluationsScreen } from "@/components/screens/evaluations";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Évaluations" };

export default async function EvaluationsPage() {
  const profile = await requireModule("notes");
  return (
    <AppShell profile={profile} module="notes">
      <EvaluationsScreen />
    </AppShell>
  );
}
