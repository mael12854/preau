import type { Metadata } from "next";
import { CompteScreen } from "@/components/screens/compte";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon compte" };

export default async function Page() {
  const profile = await requireModule("compte");
  const { data } = await (await createClient())
    .from("profile_private")
    .select("phone, notification_settings")
    .eq("profile_id", profile.profileId)
    .maybeSingle();
  const settings = (data?.notification_settings ?? {}) as Record<string, boolean>;
  return (
    <AppShell profile={profile} module="compte">
      <CompteScreen account={{ name: profile.name, email: profile.email, phone: data?.phone ?? "", notifications: settings }} />
    </AppShell>
  );
}
