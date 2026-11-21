import type { Metadata } from "next";
import Link from "next/link";
import { MathsSession } from "@/components/screens/maths-session";
import { AppShell } from "@/components/shell/app-shell";
import { exerciseById } from "@/lib/maths/catalog";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Entraînement · Exercices de maths" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ex?: string }> }) {
  const profile = await requireModule("exercices");
  const { ex } = await searchParams;
  const ids = (ex ?? "").split(",").filter((id) => exerciseById.has(id)).slice(0, 5);
  const title = ids.length === 1 ? exerciseById.get(ids[0])!.title : `Entraînement (${ids.length} exercices)`;
  return (
    <AppShell profile={profile} module="exercices">
      <div className="flex flex-col gap-4">
        <Link href="/exercices" className="w-fit text-label font-bold text-brand hover:underline">
          ← Exercices
        </Link>
        {ids.length && ["college", "lycee", "primaire"].includes(profile.id) ? (
          <MathsSession key={ids.join(",")} mode={{ kind: "entrainement", exerciseIds: ids, title }} />
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">Choisissez des exercices depuis la page Exercices.</p>
        )}
      </div>
    </AppShell>
  );
}
