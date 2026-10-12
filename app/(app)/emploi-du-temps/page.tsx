import type { Metadata } from "next";
import { EdtScreen } from "@/components/screens/edt";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getWeekLessons } from "@/lib/data/timetable";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Emploi du temps" };

export default async function EdtPage() {
  const profile = await requireModule("edt");
  const supabase = await createClient();
  const scope = profile.student ? { classId: profile.student.classId } : { teacherId: profile.profileId };
  const week = await getWeekLessons(supabase, scope, now());
  return (
    <AppShell profile={profile} module="edt">
      {week.lessons.length === 0 && !profile.student && profile.id !== "prof" ? (
        <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
          Aucun cours à votre nom cette semaine.
        </p>
      ) : (
        <EdtScreen days={week.days} todayIndex={week.todayIndex} lessons={week.lessons} showClass={!profile.student} />
      )}
    </AppShell>
  );
}
