import type { Metadata } from "next";
import { AppelScreen } from "@/components/screens/appel";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getAppel } from "@/lib/data/teacher";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Appel & évaluation" };

export default async function AppelPage() {
  const profile = await requireModule("saisie");
  const data = await getAppel(await createClient(), profile.profileId, now());
  return (
    <AppShell profile={profile} module="saisie">
      <AppelScreen data={data} />
    </AppShell>
  );
}
