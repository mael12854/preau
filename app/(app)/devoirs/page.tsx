import type { Metadata } from "next";
import { DevoirsScreen } from "@/components/screens/devoirs";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getDoneHomework, getUpcomingHomework } from "@/lib/data/homework";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Devoirs" };

export default async function DevoirsPage() {
  const profile = await requireModule("devoirs");
  const supabase = await createClient();
  const scope = profile.staff ? { teacherId: profile.profileId } : profile.student ? { classId: profile.student.classIds } : null;
  const [days, done] = await Promise.all([
    scope ? getUpcomingHomework(supabase, scope, now()) : [],
    profile.staff ? [] : getDoneHomework(supabase, profile.userId),
  ]);
  return (
    <AppShell profile={profile} module="devoirs">
      <DevoirsScreen staff={profile.staff} days={days} initialDone={done} />
    </AppShell>
  );
}
