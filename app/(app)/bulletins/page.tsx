import type { Metadata } from "next";
import { BulletinsScreen } from "@/components/screens/bulletins";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Bulletins" };

export default async function Page() {
  const profile = await requireModule("bulletins");
  return (
    <AppShell profile={profile} module="bulletins">
      <BulletinsScreen />
    </AppShell>
  );
}
