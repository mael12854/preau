import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Documents" };

export default async function Page() {
  const profile = await requireModule("documents");
  return (
    <AppShell profile={profile} module="documents">
      <DocumentsScreen />
    </AppShell>
  );
}
