import type { Metadata } from "next";
import { BulletinsScreen } from "@/components/screens/bulletins";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getReportCards } from "@/lib/data/school";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bulletins" };

export default async function Page() {
  const profile = await requireModule("bulletins");
  const periods = await getReportCards(await createClient(), now());
  return (
    <AppShell profile={profile} module="bulletins">
      <BulletinsScreen periods={periods} showStudent={profile.staff} scale={profile.scale} grading={profile.grading} />
    </AppShell>
  );
}
