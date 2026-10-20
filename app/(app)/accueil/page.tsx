import type { Metadata } from "next";
import { StaffDashboard } from "@/components/screens/dashboard-staff";
import { ChildDashboard, StudentDashboard } from "@/components/screens/dashboard-student";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getLastEvaluations } from "@/lib/data/evaluations";
import { getLiaisonNotes } from "@/lib/data/liaison";
import { getDoneHomework, getUpcomingHomework } from "@/lib/data/homework";
import { getMessages } from "@/lib/data/messages";
import { getLifeEvents } from "@/lib/data/school-life";
import { getStaffDashboard } from "@/lib/data/staff";
import { getTeacherDashboard } from "@/lib/data/teacher";
import { getTodayLessons } from "@/lib/data/timetable";
import { addDays, formatDayLong, isoDay } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const profile = await requireModule("dash");
  const supabase = await createClient();
  const reference = now();

  if (profile.staff) {
    const data =
      profile.id === "cpe" || profile.id === "direction" || profile.id === "secretariat"
        ? await getStaffDashboard(supabase, profile.id, reference)
        : await getTeacherDashboard(supabase, profile.profileId, reference);
    return (
      <AppShell profile={profile} module="dash">
        <StaffDashboard profile={profile} data={data} />
      </AppShell>
    );
  }

  const student = profile.student;
  const primary = profile.scale === "primaire";
  const [today, homework, done, lastEvaluations, life, messages, liaison] = await Promise.all([
    student ? getTodayLessons(supabase, { classId: student.classIds, studentId: student.id }, reference) : [],
    student ? getUpcomingHomework(supabase, { classId: student.classIds }, reference) : [],
    getDoneHomework(supabase, profile.userId),
    student ? getLastEvaluations(supabase, student.id) : [],
    getLifeEvents(supabase, student?.id ?? null, true),
    getMessages(supabase, profile.profileId, "recus", reference),
    primary && student ? getLiaisonNotes(supabase, { classId: student.classIds, studentId: student.id }, reference) : [],
  ]);
  const next = homework[0] ?? null;
  const tomorrow = addDays(isoDay(reference), 1);
  const first = life.firstToJustify;

  const Dashboard = profile.id === "primaire" ? ChildDashboard : StudentDashboard;
  return (
    <AppShell profile={profile} module="dash">
      <Dashboard
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
          liaison,
        }}
      />
    </AppShell>
  );
}
