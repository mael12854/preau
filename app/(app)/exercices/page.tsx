import type { Metadata } from "next";
import { StudentMaths, TeacherMaths } from "@/components/screens/exercices";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getStudentAssignments, getTeacherAssignments, getTrainingHistory } from "@/lib/data/maths";
import { getPublishTargets } from "@/lib/data/targets";
import { isoDay } from "@/lib/format";
import { levelOfClass } from "@/lib/maths/chapters";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Exercices de maths" };

export default async function Page() {
  const profile = await requireModule("exercices");
  const today = isoDay(now());
  const sections = await getSections(profile, "exercices");
  const data = await Promise.all(
    sections.map(async ({ viewer, supabase }) => {
      const teacher = viewer.id === "prof" || viewer.id === "enseignant-primaire";
      if (teacher) {
        const [assignments, targets] = await Promise.all([
          getTeacherAssignments(supabase, viewer.profileId),
          getPublishTargets(supabase, viewer),
        ]);
        const classes = targets?.classes ?? [];
        return { teacher: true as const, assignments, classes, level: levelOfClass(classes[0]?.name) };
      }
      const student = viewer.student;
      const isStudent = ["college", "lycee", "primaire"].includes(viewer.id);
      const [assignments, history] = await Promise.all([
        student ? getStudentAssignments(supabase, student.id, student.classIds) : [],
        isStudent && student ? getTrainingHistory(supabase, student.id) : [],
      ]);
      return { teacher: false as const, assignments, history, family: !isStudent, level: levelOfClass(student?.className) };
    }),
  );
  return (
    <AppShell profile={profile} module="exercices">
      <Sections
        sections={sections}
        render={(_, i) => {
          const d = data[i];
          return d.teacher ? (
            <TeacherMaths assignments={d.assignments} classes={d.classes} today={today} defaultLevel={d.level} />
          ) : (
            <StudentMaths assignments={d.assignments} today={today} defaultLevel={d.level} family={d.family} history={d.history} />
          );
        }}
      />
    </AppShell>
  );
}
