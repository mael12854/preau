import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents";
import { AppShell } from "@/components/shell/app-shell";
import { getDocuments } from "@/lib/data/school";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function Page() {
  const profile = await requireModule("documents");
  const documents = await getDocuments(await createClient(), profile.profileId);
  return (
    <AppShell profile={profile} module="documents">
      <DocumentsScreen documents={documents} />
    </AppShell>
  );
}
