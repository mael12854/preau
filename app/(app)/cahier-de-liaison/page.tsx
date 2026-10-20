import type { Metadata } from "next";
import { LiaisonScreen } from "@/components/screens/liaison";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getLiaisonNotes, getTeacherClasses } from "@/lib/data/liaison";
import { getSections, requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cahier de liaison" };

export default async function LiaisonPage() {
  const profile = await requireModule("liaison");
  const supabase = await createClient();
  const reference = now();

  if (profile.staff) {
    const sections = await getSections(profile, "liaison");
    const data = await Promise.all(
      sections.map(({ viewer, supabase: db }) =>
        Promise.all([
          getLiaisonNotes(db, { authorId: viewer.profileId }, reference),
          getTeacherClasses(db, viewer.profileId),
        ]),
      ),
    );
    return (
      <AppShell profile={profile} module="liaison">
        <Sections
          sections={sections}
          render={(_, i) => <LiaisonScreen notes={data[i][0]} mode={{ kind: "enseignant", classes: data[i][1] }} />}
        />
      </AppShell>
    );
  }

  const student = profile.student;
  const notes = student ? await getLiaisonNotes(supabase, { classId: student.classIds, studentId: student.id }, reference) : [];
  return (
    <AppShell profile={profile} module="liaison">
      <LiaisonScreen notes={notes} mode={profile.id === "primaire" || !student ? { kind: "enfant" } : { kind: "famille", studentId: student.id }} />
    </AppShell>
  );
}
