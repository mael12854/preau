import type { Metadata } from "next";
import { PaiementsScreen } from "@/components/screens/paiements";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Paiements & cantine" };

export default async function Page() {
  const profile = await requireModule("paiements");
  return (
    <AppShell profile={profile} module="paiements">
      <PaiementsScreen />
    </AppShell>
  );
}
