import type { Metadata } from "next";
import { DevoirsScreen } from "@/components/screens/devoirs";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Devoirs" };

export default async function DevoirsPage() {
  const profile = await requireModule("devoirs");
  return (
    <AppShell profile={profile} module="devoirs">
      <DevoirsScreen staff={profile.staff} />
    </AppShell>
  );
}
