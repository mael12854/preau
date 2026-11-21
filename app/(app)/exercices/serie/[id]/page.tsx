import type { Metadata } from "next";
import Link from "next/link";
import { MathsSession } from "@/components/screens/maths-session";
import { AppShell } from "@/components/shell/app-shell";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Exercices de maths" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireModule("exercices");
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase.from("math_assignments").select("id, title, max_attempts").eq("id", id).maybeSingle();
  const { data: attempts } = a
    ? await supabase.from("math_attempts").select("score").eq("assignment_id", id).eq("student_id", profile.profileId).not("submitted_at", "is", null)
    : { data: [] };
  const done = attempts ?? [];
  return (
    <AppShell profile={profile} module="exercices">
      <div className="flex flex-col gap-4">
        <Link href="/exercices" className="w-fit text-label font-bold text-brand hover:underline">
          ← Exercices
        </Link>
        {a && ["college", "lycee", "primaire"].includes(profile.id) ? (
          <MathsSession
            mode={{
              kind: "serie",
              assignmentId: a.id,
              title: a.title,
              attemptsLeft: a.max_attempts === null ? null : Math.max(0, a.max_attempts - done.length),
              best: done.length ? Math.max(...done.map((t) => Number(t.score ?? 0))) : null,
            }}
          />
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Cette série n&apos;existe pas ou ne vous concerne pas.</p>
        )}
      </div>
    </AppShell>
  );
}
