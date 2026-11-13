import type { Metadata } from "next";
import Link from "next/link";
import { MeetingScreen } from "@/components/screens/reunion";
import { AppShell } from "@/components/shell/app-shell";
import { getMeetingBoard } from "@/lib/data/meetings";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Réunion parents-profs" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireModule("reunions");
  const { id } = await params;
  const board = await getMeetingBoard(await createClient(), id);
  return (
    <AppShell profile={profile} module="reunions">
      <div className="flex flex-col gap-4">
        <Link href="/reunions" className="w-fit text-label font-bold text-brand hover:underline print:hidden">
          ← Toutes les réunions
        </Link>
        {board ? (
          <MeetingScreen board={board} teacher={profile.id === "prof" || profile.id === "enseignant-primaire"} admin={profile.id === "direction" || profile.id === "secretariat" || profile.id === "cpe"}
            student={profile.id === "college" || profile.id === "lycee" || profile.id === "primaire"}
          />
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
            Cette réunion n&apos;existe pas ou ne vous concerne pas.
          </p>
        )}
      </div>
    </AppShell>
  );
}
