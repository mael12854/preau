import type { Metadata } from "next";
import { QuizHome } from "@/components/screens/quiz";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { getLiveSessions, getMyQuizzes, teachingClasses } from "@/lib/data/tools";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Quiz en direct" };

export default async function Page() {
  const profile = await requireModule("outils");
  const sections = await getSections(profile, "outils");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) =>
      Promise.all([
        viewer.staff ? getMyQuizzes(supabase, viewer) : [],
        teachingClasses(supabase, viewer),
        getLiveSessions(supabase, viewer),
      ]),
    ),
  );
  return (
    <AppShell profile={profile} module="outils">
      <Sections
        sections={sections}
        render={(s, i) => (
          <QuizHome staff={s.viewer.staff} quizzes={data[i][0]} classes={data[i][1]} live={data[i][2]} />
        )}
      />
    </AppShell>
  );
}
