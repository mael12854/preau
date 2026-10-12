import type { Metadata } from "next";
import { LiaisonScreen } from "@/components/screens/liaison";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getLiaisonNotes, getTeacherClasses } from "@/lib/data/liaison";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cahier de liaison" };

export default async function LiaisonPage() {
  const profile = await requireModule("liaison");
  const supabase = await createClient();
  const reference = now();

  if (profile.staff) {
    const [notes, classes] = await Promise.all([
      getLiaisonNotes(supabase, { authorId: profile.profileId }, reference),
      getTeacherClasses(supabase, profile.profileId),
    ]);
    return (
      <AppShell profile={profile} module="liaison">
        <LiaisonScreen notes={notes} mode={{ kind: "enseignant", classes }} />
      </AppShell>
    );
  }

  const student = profile.student;
  const notes = student ? await getLiaisonNotes(supabase, { classId: student.classId, studentId: student.id }, reference) : [];
  return (
    <AppShell profile={profile} module="liaison">
      <LiaisonScreen notes={notes} mode={profile.id === "primaire" || !student ? { kind: "enfant" } : { kind: "famille", studentId: student.id }} />
    </AppShell>
  );
}
