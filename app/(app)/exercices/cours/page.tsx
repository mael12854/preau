import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonView } from "@/components/screens/maths-cours";
import { AppShell } from "@/components/shell/app-shell";
import { cn } from "@/lib/cn";
import { CHAPTERS, chapterById } from "@/lib/maths/chapters";
import { LEVELS } from "@/lib/maths/core";
import { LESSONS } from "@/lib/maths/cours";
import { requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Cours de maths" };

/** Leçons à recopier : réservées aux enseignants (les élèves les recopient dans leur cahier). */
export default async function Page({ searchParams }: { searchParams: Promise<{ niveau?: string; chapitre?: string }> }) {
  const profile = await requireModule("exercices");
  if (profile.id !== "prof" && profile.id !== "enseignant-primaire") redirect("/exercices");
  const { niveau, chapitre } = await searchParams;
  const chosen = chapitre ? chapterById.get(chapitre) : undefined;
  const level = chosen?.level ?? LEVELS.find((l) => l === niveau) ?? "6e";
  const lesson = chosen ? LESSONS.get(chosen.id) : undefined;
  return (
    <AppShell profile={profile} module="exercices">
      <div className="flex flex-col gap-4">
        <Link href="/exercices" className="w-fit text-label font-bold text-brand hover:underline print:hidden">
          ← Exercices
        </Link>
        <nav aria-label="Niveau" className="flex flex-wrap gap-1.5 print:hidden">
          {LEVELS.map((l) => (
            <Link
              key={l}
              href={`/exercices/cours?niveau=${l}`}
              aria-current={l === level ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center rounded-control border border-line px-3 text-label font-bold",
                l === level && "border-brand bg-brand text-on-brand",
              )}
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <nav aria-label="Chapitres" className="flex flex-col overflow-hidden rounded-card border border-line bg-surface print:hidden">
            {CHAPTERS.filter((c) => c.level === level).map((c) => (
              <Link
                key={c.id}
                href={`/exercices/cours?chapitre=${c.id}`}
                aria-current={c.id === chosen?.id ? "page" : undefined}
                className={cn(
                  "border-b border-line-soft px-4 py-3 text-label last:border-b-0 hover:bg-neutral-bg",
                  c.id === chosen?.id && "bg-surface-2 font-bold",
                )}
              >
                {c.title}
              </Link>
            ))}
          </nav>
          {chosen && lesson ? (
            <LessonView title={chosen.title} level={chosen.level} blocs={lesson.blocs} chapterId={chosen.id} />
          ) : (
            <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">
              Choisissez un chapitre pour afficher la leçon à faire recopier.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
