import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TirageScreen } from "@/components/screens/tirage";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { getDrawClasses } from "@/lib/data/tools";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Tirage au sort et groupes" };

export default async function Page() {
  const profile = await requireModule("outils");
  if (!profile.staff) redirect("/outils");
  const sections = await getSections(profile, "outils");
  const data = await Promise.all(sections.map(({ viewer, supabase }) => getDrawClasses(supabase, viewer)));
  return (
    <AppShell profile={profile} module="outils">
      <Sections sections={sections} render={(_, i) => <TirageScreen classes={data[i]} />} />
    </AppShell>
  );
}
