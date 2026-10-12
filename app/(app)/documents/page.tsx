import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/screens/documents";
import { AppShell } from "@/components/shell/app-shell";
import { getDocuments } from "@/lib/data/school";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function Page() {
  const profile = await requireModule("documents");
  const supabase = await createClient();
  const admin =
    profile.id === "cpe" ||
    profile.id === "direction" ||
    profile.id === "secretariat";
  const teacher = profile.id === "prof" || profile.id === "enseignant-primaire";
  const manager = profile.id === "direction" || profile.id === "secretariat";

  // Classes proposées à l'envoi : tout l'établissement pour l'administration, ses classes pour un professeur.
  let classes: { id: string; name: string }[] = [];
  if (admin) {
    classes =
      (await supabase.from("classes").select("id, name").order("name")).data ??
      [];
  } else if (teacher) {
    const [{ data: t }, { data: own }] = await Promise.all([
      supabase
        .from("teachings")
        .select("classes(id, name)")
        .eq("teacher_id", profile.profileId),
      supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", profile.profileId),
    ]);
    const all = [
      ...(t ?? []).flatMap((x) => (x.classes ? [x.classes] : [])),
      ...(own ?? []),
    ];
    classes = [...new Map(all.map((c) => [c.id, c])).values()].sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
  }

  const documents = await getDocuments(supabase, profile.profileId, manager);
  return (
    <AppShell profile={profile} module="documents">
      <DocumentsScreen
        documents={documents}
        upload={
          admin || (teacher && classes.length > 0)
            ? { classes, wholeSchool: admin, teacher }
            : null
        }
      />
    </AppShell>
  );
}
