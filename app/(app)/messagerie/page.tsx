import type { Metadata } from "next";
import { MessagerieScreen } from "@/components/screens/messagerie";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Messagerie" };

export default async function MessageriePage() {
  const profile = await requireModule("messages");
  return (
    <AppShell profile={profile} module="messages">
      <MessagerieScreen />
    </AppShell>
  );
}
