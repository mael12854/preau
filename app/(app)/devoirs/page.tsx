import type { Metadata } from "next";
import { DevoirsScreen } from "@/components/screens/devoirs";
import { GiveHomework } from "@/components/screens/devoirs-editor";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { LessonNoteEditor, LessonNotesList } from "@/components/screens/seances";
import {
  getDoneHomework,
  getHomeworkChoices,
  getLessonNotes,
  getNoteLessons,
  getUpcomingHomework,
} from "@/lib/data/homework";
import { isoDay } from "@/lib/format";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Devoirs" };

export default async function DevoirsPage() {
  const profile = await requireModule("devoirs");
  const reference = now();
  const today = isoDay(reference);
  const sections = await getSections(profile, "devoirs");
  // Enseignant : il donne les devoirs de ses classes et peut les modifier ou les retirer.
  const data = await Promise.all(
    sections.map(async ({ viewer, supabase }) => {
      const scope = viewer.staff
        ? { teacherId: viewer.profileId }
        : viewer.student
          ? { classId: viewer.student.classIds }
          : null;
      const teacher = viewer.id === "prof" || viewer.id === "enseignant-primaire";
      const [days, done, choices, notes, noteLessons] = await Promise.all([
        scope ? getUpcomingHomework(supabase, scope, reference) : [],
        viewer.staff ? [] : getDoneHomework(supabase, viewer.userId),
        teacher ? getHomeworkChoices(supabase, viewer.profileId, reference) : [],
        scope ? getLessonNotes(supabase, scope, reference) : [],
        teacher ? getNoteLessons(supabase, viewer.profileId, reference) : [],
      ]);
      return { days, done, choices, teacher, notes, noteLessons };
    }),
  );
  return (
    <AppShell profile={profile} module="devoirs">
      <Sections
        sections={sections}
        render={(s, i) => (
          <div className="flex flex-col gap-4">
            {data[i].teacher && (
              <div className="flex flex-wrap justify-end gap-2">
                <LessonNoteEditor
                  lessons={data[i].noteLessons}
                  initialLesson={data[i].noteLessons.find((l) => new Date(l.startsAt) <= reference)?.id}
                />
                <GiveHomework choices={data[i].choices} today={today} />
              </div>
            )}
            <DevoirsScreen
              staff={s.viewer.staff}
              days={data[i].days}
              initialDone={data[i].done}
              editable={data[i].teacher}
              today={today}
            />
            <LessonNotesList notes={data[i].notes} staff={s.viewer.staff} />
          </div>
        )}
      />
    </AppShell>
  );
}
