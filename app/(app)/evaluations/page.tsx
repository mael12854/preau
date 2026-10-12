import type { Metadata } from "next";
import { EvaluationsScreen } from "@/components/screens/evaluations";
import { AppShell } from "@/components/shell/app-shell";
import { getStudentEvaluations } from "@/lib/data/evaluations";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Évaluations" };

export default async function EvaluationsPage() {
  const profile = await requireModule("notes");
  const supabase = await createClient();
  const subjects = profile.student ? await getStudentEvaluations(supabase, profile.student.id, profile.student.classIds) : [];
  return (
    <AppShell profile={profile} module="notes">
      <EvaluationsScreen subjects={subjects} currentTerm={1} scale={profile.scale} grading={profile.grading} />
    </AppShell>
  );
}
