import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { getDocuments } from "@/lib/data/school";
import { getPublishTargets, isManager } from "@/lib/data/targets";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Documents" };

export default async function Page() {
  const profile = await requireModule("documents");
  const sections = await getSections(profile, "documents");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) =>
      Promise.all([
        getPublishTargets(supabase, viewer),
        getDocuments(supabase, viewer.profileId, isManager(viewer)),
      ]),
    ),
  );
  return (
    <AppShell profile={profile} module="documents">
      <Sections sections={sections} render={(_, i) => <DocumentsScreen documents={data[i][1]} upload={data[i][0]} />} />
    </AppShell>
  );
}
