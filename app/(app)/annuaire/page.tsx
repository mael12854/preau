import type { Metadata } from "next";
import { DirectoryScreen } from "@/components/screens/annuaire";
import { AppShell } from "@/components/shell/app-shell";
import { getDirectory } from "@/lib/data/directory";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Annuaire" };

export default async function Page() {
  const profile = await requireModule("annuaire");
  const people = await getDirectory(await createClient());
  return (
    <AppShell profile={profile} module="annuaire">
      <DirectoryScreen people={people} />
    </AppShell>
  );
}
