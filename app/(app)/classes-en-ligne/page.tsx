import type { Metadata } from "next";
import { ClassesEnLigneScreen } from "@/components/screens/classes-en-ligne";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { getOnlineClasses } from "@/lib/data/online";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Mes classes en ligne" };

export default async function Page() {
  const profile = await requireModule("enligne");
  const sections = await getSections(profile, "enligne");
  const data = await Promise.all(sections.map(({ viewer, supabase }) => getOnlineClasses(supabase, viewer)));
  return (
    <AppShell profile={profile} module="enligne">
      <Sections sections={sections} render={(_, i) => <ClassesEnLigneScreen classes={data[i]} />} />
    </AppShell>
  );
}
