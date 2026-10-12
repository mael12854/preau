import type { Metadata } from "next";
import { StaffDashboard } from "@/components/screens/dashboard-staff";
import { StudentDashboard } from "@/components/screens/dashboard-student";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getLastEvaluations } from "@/lib/data/evaluations";
import { getDoneHomework, getUpcomingHomework } from "@/lib/data/homework";
import { getMessages } from "@/lib/data/messages";
import { getLifeEvents } from "@/lib/data/school-life";
import { getTeacherDashboard } from "@/lib/data/teacher";
import { getTodayLessons } from "@/lib/data/timetable";
import { addDays, formatDayLong, isoDay } from "@/lib/format";
import { STAFF_DASHBOARDS } from "@/lib/mock/staff";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const profile = await requireModule("dash");
  const supabase = await createClient();
  const reference = now();

  if (profile.staff) {
    // Le tableau de bord du professeur est calculé depuis la base ; ceux de la vie scolaire,
    // de la direction et du secrétariat utilisent encore les données du prototype.
    const data = profile.id === "prof" ? await getTeacherDashboard(supabase, profile.profileId, reference) : STAFF_DASHBOARDS[profile.id]!;
    return (
      <AppShell profile={profile} module="dash">
        <StaffDashboard profile={profile} data={data} />
      </AppShell>
    );
  }

  const student = profile.student;
  const [today, homework, done, lastEvaluations, life, messages] = await Promise.all([
    student ? getTodayLessons(supabase, { classId: student.classId }, reference) : [],
    student ? getUpcomingHomework(supabase, { classId: student.classId }, reference) : [],
    getDoneHomework(supabase, profile.userId),
    student ? getLastEvaluations(supabase, student.id) : [],
    getLifeEvents(supabase, student?.id ?? null, true),
    getMessages(supabase, profile.profileId, "recus", reference),
  ]);
  const next = homework[0] ?? null;
  const tomorrow = addDays(isoDay(reference), 1);
  const first = life.firstToJustify;

  return (
    <AppShell profile={profile} module="dash">
      <StudentDashboard
        profile={profile}
        data={{
          today,
          next,
          nextTitle: !next || next.dueOn === tomorrow ? "Pour demain" : next.day,
          done,
          lastEvaluations,
          stats: life.stats,
          toJustify: first ? `${formatDayLong(first.occurred_at)}${first.whole_day ? ", journée entière" : ""}` : null,
          unread: messages.filter((m) => m.unread).length,
          messages,
        }}
      />
    </AppShell>
  );
}
