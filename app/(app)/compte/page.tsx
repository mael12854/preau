import type { Metadata } from "next";
import { CompteScreen } from "@/components/screens/compte";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte" };

export default async function Page() {
  const profile = await requireModule("compte");
  return (
    <AppShell profile={profile} module="compte">
      <CompteScreen profile={profile} />
    </AppShell>
  );
}
