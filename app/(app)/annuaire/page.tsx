import type { Metadata } from "next";
import { DirectoryScreen } from "@/components/screens/annuaire";
import { AppShell } from "@/components/shell/app-shell";
import { getDirectory } from "@/lib/data/directory";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Annuaire" };

export default async function Page() {
  const profile = await requireModule("annuaire");
  const supabase = await createClient();
  const [people, { data: classes }, { data: subjects }] = await Promise.all([
    getDirectory(supabase),
    supabase.from("classes").select("id, name, level, hidden").order("name"),
    supabase.from("subjects").select("id, name").order("name"),
  ]);
  return (
    <AppShell profile={profile} module="annuaire">
      <DirectoryScreen
        people={people}
        // Classes masquées : gardées pour y inscrire des élèves, signalées comme telles.
        classes={(classes ?? []).map((c) => ({
          id: c.id,
          level: c.level,
          name: c.hidden ? `${c.name} (masquée)` : c.name,
        }))}
        subjects={subjects ?? []}
        canAddDirection={profile.id === "direction"}
      />
    </AppShell>
  );
}
