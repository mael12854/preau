import type { Metadata } from "next";
import { AgendaScreen } from "@/components/screens/agenda";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Agenda" };

export default async function Page() {
  const profile = await requireModule("agenda");
  return (
    <AppShell profile={profile} module="agenda">
      <AgendaScreen />
    </AppShell>
  );
}
