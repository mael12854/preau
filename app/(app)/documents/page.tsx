import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents";
import { AppShell } from "@/components/shell/app-shell";
import { getDocuments } from "@/lib/data/school";
import { getPublishTargets, isManager } from "@/lib/data/targets";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function Page() {
  const profile = await requireModule("documents");
  const supabase = await createClient();
  const [targets, documents] = await Promise.all([
    getPublishTargets(supabase, profile),
    getDocuments(supabase, profile.profileId, isManager(profile)),
  ]);
  return (
    <AppShell profile={profile} module="documents">
      <DocumentsScreen documents={documents} upload={targets} />
    </AppShell>
  );
}
