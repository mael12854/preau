import type { Metadata } from "next";
import { ApplisScreen } from "@/components/screens/applis";
import { AppShell } from "@/components/shell/app-shell";
import { getMyApps } from "@/lib/data/online";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes applis" };

export default async function Page() {
  const profile = await requireModule("applis");
  const apps = await getMyApps(await createClient(), profile);
  return (
    <AppShell profile={profile} module="applis">
      <ApplisScreen apps={apps} />
    </AppShell>
  );
}
