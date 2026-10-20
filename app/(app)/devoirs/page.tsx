import type { Metadata } from "next";
import { DevoirsScreen } from "@/components/screens/devoirs";
import { GiveHomework } from "@/components/screens/devoirs-editor";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import {
  getDoneHomework,
  getHomeworkChoices,
  getUpcomingHomework,
} from "@/lib/data/homework";
import { isoDay } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Devoirs" };

export default async function DevoirsPage() {
  const profile = await requireModule("devoirs");
  const supabase = await createClient();
  const reference = now();
  const scope = profile.staff ? { teacherId: profile.profileId } : profile.student ? { classId: profile.student.classIds } : null;
  // Enseignant : il donne les devoirs de ses classes et peut les modifier ou les retirer.
  const teacher = profile.id === "prof" || profile.id === "enseignant-primaire";
  const [days, done, choices] = await Promise.all([
    scope ? getUpcomingHomework(supabase, scope, reference) : [],
    profile.staff ? [] : getDoneHomework(supabase, profile.userId),
    teacher ? getHomeworkChoices(supabase, profile.profileId, reference) : [],
  ]);
  const today = isoDay(reference);
  return (
    <AppShell profile={profile} module="devoirs">
      <div className="flex flex-col gap-4">
        {teacher && (
          <div className="flex justify-end">
            <GiveHomework choices={choices} today={today} />
          </div>
        )}
        <DevoirsScreen
          staff={profile.staff}
          days={days}
          initialDone={done}
          editable={teacher}
          today={today}
        />
      </div>
    </AppShell>
  );
}
