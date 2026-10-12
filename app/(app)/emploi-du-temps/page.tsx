import type { Metadata } from "next";
import { EdtScreen } from "@/components/screens/edt";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Emploi du temps" };

export default async function EdtPage() {
  const profile = await requireModule("edt");
  return (
    <AppShell profile={profile} module="edt">
      <EdtScreen />
    </AppShell>
  );
}
