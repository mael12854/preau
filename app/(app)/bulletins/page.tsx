import type { Metadata } from "next";
import { BulletinsScreen } from "@/components/screens/bulletins";
import { BulletinsEditor } from "@/components/screens/bulletins-editor";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getReportEditor } from "@/lib/data/report-editor";
import { getReportCards } from "@/lib/data/school";
import { isoDay } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bulletins" };

export default async function Page({ searchParams }: { searchParams: Promise<{ classe?: string; trimestre?: string }> }) {
  const profile = await requireModule("bulletins");
  const supabase = await createClient();
  const reference = now();

  // Personnel : préparation et saisie. Familles et élèves : consultation des bulletins publiés.
  if (profile.staff) {
    const { classe, trimestre } = await searchParams;
    const term = [1, 2, 3].includes(Number(trimestre)) ? Number(trimestre) : 1;
    const view = await getReportEditor(supabase, profile, classe, term);
    return (
      <AppShell profile={profile} module="bulletins">
        {view ? (
          <BulletinsEditor view={view} scale={profile.scale} grading={profile.grading} today={isoDay(reference)} />
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Aucune classe pour l&apos;instant.</p>
        )}
      </AppShell>
    );
  }

  const periods = await getReportCards(supabase, reference, profile.grading);
  return (
    <AppShell profile={profile} module="bulletins">
      <BulletinsScreen periods={periods} showStudent={profile.staff} scale={profile.scale} grading={profile.grading} />
    </AppShell>
  );
}
