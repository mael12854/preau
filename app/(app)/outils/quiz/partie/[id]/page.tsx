import type { Metadata } from "next";
import { QuizPlay } from "@/components/screens/quiz-play";
import { AppShell } from "@/components/shell/app-shell";
import { getHomeworkChoices } from "@/lib/data/homework";
import { now } from "@/lib/clock";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Quiz" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireModule("outils");
  const { id } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase.from("quiz_sessions").select("id, class_id, host_id").eq("id", id).maybeSingle();
  // Matières du professeur dans la classe, pour envoyer les résultats dans une évaluation.
  const subjects =
    session && profile.staff
      ? (await getHomeworkChoices(supabase, session.host_id, now()))
          .filter((c) => c.classId === session.class_id)
          .map((c) => ({ value: c.subjectId, label: c.label.split(" · ").slice(1).join(" · ") || c.label }))
      : [];
  return (
    <AppShell profile={profile} module="outils">
      {session ? (
        <QuizPlay sessionId={session.id} subjects={subjects} />
      ) : (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Cette partie n&apos;existe pas ou n&apos;est pas pour votre classe.
        </p>
      )}
    </AppShell>
  );
}
