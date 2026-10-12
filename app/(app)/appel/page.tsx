import type { Metadata } from "next";
import { AppelScreen } from "@/components/screens/appel";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Appel & évaluation" };

export default async function AppelPage() {
  const profile = await requireModule("saisie");
  return (
    <AppShell profile={profile} module="saisie">
      <AppelScreen />
    </AppShell>
  );
}
