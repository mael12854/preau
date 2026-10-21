"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { removeQuiz, saveQuiz, startQuiz } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import type { LiveSession, QuizQuestion, QuizSummary } from "@/lib/data/tools";

const LETTERS = ["A", "B", "C", "D"];
const blank = (): QuizQuestion => ({ prompt: "", choices: ["", ""], correct: 0, seconds: 20 });

/** Éditeur de quiz : questions à 2–4 réponses, une bonne réponse, un temps par question. */
function QuizEditor({ quiz, trigger }: { quiz?: QuizSummary; trigger: React.ReactNode }) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz?.questions.length ? quiz.questions : [blank()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<QuizQuestion>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTitle(quiz?.title ?? "");
          setQuestions(quiz?.questions.length ? quiz.questions : [blank()]);
          setError(null);
        }
      }}
      title={quiz ? "Modifier le quiz" : "Nouveau quiz"}
      className="w-[min(44rem,calc(100vw-2rem))]"
      trigger={trigger}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = questions.map((q) => {
            const kept = q.choices.map((c, k) => ({ c: c.trim(), k })).filter((x) => x.c);
            return {
              prompt: q.prompt.trim(),
              choices: kept.map((x) => x.c),
              correct: Math.max(0, kept.findIndex((x) => x.k === q.correct)),
              seconds: q.seconds,
              lost: !kept.some((x) => x.k === q.correct),
            };
          });
          const bad = clean.findIndex((q) => !q.prompt || q.choices.length < 2 || q.lost);
          if (!title.trim()) return setError("Donnez un titre au quiz.");
          if (bad >= 0) return setError(`Question ${bad + 1} : écrivez la question, au moins deux réponses, et cochez la bonne.`);
          setError(null);
          start(async () => {
            const r = await saveQuiz(quiz?.id ?? null, title.trim(), clean.map(({ lost: _lost, ...q }) => q));
            if (!r.ok) return setError(r.error ?? "");
            toast({ title: quiz ? "Quiz modifié" : "Quiz créé" });
            setOpen(false);
            router.refresh();
          });
        }}
      >
        <TextField label="Titre" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {questions.map((q, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-card border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <b className="text-ui">Question {i + 1}</b>
                {questions.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Retirer la question ${i + 1}`}
                    onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                    className="flex size-9 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                )}
              </div>
              <TextField label="Question" value={q.prompt} maxLength={300} onChange={(e) => set(i, { prompt: e.target.value })} />
              <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className="mb-1 text-label font-bold">Réponses (cochez la bonne)</legend>
                {q.choices.map((c, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`bonne-${i}`}
                      checked={q.correct === k}
                      onChange={() => set(i, { correct: k })}
                      aria-label={`Réponse ${LETTERS[k]} : bonne réponse`}
                      className="size-5 accent-[var(--brand)]"
                    />
                    <span aria-hidden="true" className="w-5 text-label font-bold text-ink-muted">
                      {LETTERS[k]}
                    </span>
                    <input
                      value={c}
                      maxLength={120}
                      aria-label={`Réponse ${LETTERS[k]}`}
                      onChange={(e) => set(i, { choices: q.choices.map((x, j) => (j === k ? e.target.value : x)) })}
                      className="h-10 min-w-0 flex-1 rounded-control border border-line bg-surface px-2.5 text-ui"
                    />
                    {q.choices.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Retirer la réponse ${LETTERS[k]}`}
                        onClick={() =>
                          set(i, {
                            choices: q.choices.filter((_, j) => j !== k),
                            correct: q.correct === k ? 0 : q.correct > k ? q.correct - 1 : q.correct,
                          })
                        }
                        className="flex size-9 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {q.choices.length < 4 && (
                  <button
                    type="button"
                    onClick={() => set(i, { choices: [...q.choices, ""] })}
                    className="w-fit text-label font-bold text-brand underline-offset-2 hover:underline"
                  >
                    + Ajouter une réponse
                  </button>
                )}
              </fieldset>
              <SelectField
                label="Temps pour répondre"
                options={[10, 20, 30, 45, 60, 90, 120].map((v) => ({ value: String(v), label: `${v} secondes` }))}
                value={String(q.seconds)}
                onValueChange={(v) => set(i, { seconds: Number(v) })}
                className="max-w-56"
              />
            </li>
          ))}
        </ol>
        {questions.length < 50 && (
          <Button variant="secondary" icon="add" className="h-10 w-fit px-4 text-label" onClick={() => setQuestions((qs) => [...qs, blank()])}>
            Ajouter une question
          </Button>
        )}
        {error && (
          <p role="alert" className="m-0 text-label text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="h-10 px-4 text-label">
            {pending ? "Enregistrement…" : "Enregistrer le quiz"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function LaunchQuiz({ quiz, classes }: { quiz: QuizSummary; classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [pending, start] = useTransition();
  if (!classes.length) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={`Lancer « ${quiz.title} »`}
      description="Les élèves de la classe le verront dans Outils → Quiz en direct, sans code à taper."
      trigger={
        <Button icon="play_arrow" className="h-10 px-4 text-label">
          Lancer
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <SelectField label="Classe" options={classes.map((c) => ({ value: c.id, label: c.name }))} value={classId} onValueChange={setClassId} />
        <div className="flex justify-end">
          <Button
            className="h-10 px-4 text-label"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await startQuiz(quiz.id, classId);
                if (!r.ok) return toast({ title: r.error });
                router.push(`/outils/quiz/partie/${r.id}`);
              })
            }
          >
            {pending ? "Lancement…" : "Ouvrir la partie"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Quiz en direct : le professeur crée et lance ses quiz ; l'élève rejoint les parties de sa classe. */
export function QuizHome({
  staff,
  quizzes,
  classes,
  live,
}: {
  staff: boolean;
  quizzes: QuizSummary[];
  classes: { id: string; name: string }[];
  live: LiveSession[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  // Côté élève, la liste des parties se met à jour toute seule.
  useEffect(() => {
    if (staff) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [staff, router]);

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="parties" className="flex flex-col gap-3">
        <h2 id="parties" className="m-0 font-display text-h3 font-bold">
          {staff ? "Mes parties en cours" : "Quiz en cours dans ma classe"}
        </h2>
        {live.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {live.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/outils/quiz/partie/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-card border-[1.5px] border-brand bg-brand-tint px-5 py-4"
                >
                  <span className="flex flex-col">
                    <b className="text-ui">{s.title}</b>
                    <span className="text-caption text-ink-2">{s.className}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-label font-bold text-brand">
                    {staff ? "Reprendre" : "Rejoindre"} <Icon name="arrow_forward" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
            {staff ? "Aucune partie en cours." : "Aucun quiz pour l'instant. Cette page se met à jour toute seule quand votre professeur en lance un."}
          </p>
        )}
      </section>

      {staff && (
        <section aria-labelledby="mes-quiz" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="mes-quiz" className="m-0 font-display text-h3 font-bold">
              Mes quiz
            </h2>
            <QuizEditor
              trigger={
                <Button icon="add" className="h-10 px-4 text-label">
                  Nouveau quiz
                </Button>
              }
            />
          </div>
          {quizzes.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {quizzes.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface px-5 py-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <b className="text-ui">{q.title}</b>
                    <span className="text-caption text-ink-muted">
                      {q.questions.length} question{q.questions.length > 1 ? "s" : ""}
                    </span>
                  </span>
                  <LaunchQuiz quiz={q} classes={classes} />
                  <QuizEditor
                    quiz={q}
                    trigger={
                      <Button variant="secondary" icon="edit" className="h-10 px-3.5 text-label">
                        Modifier
                      </Button>
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Supprimer ${q.title}`}
                    className="flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-neutral-bg"
                    onClick={() => {
                      if (!window.confirm(`Supprimer le quiz « ${q.title} » ?`)) return;
                      start(async () => {
                        const r = await removeQuiz(q.id);
                        toast({ title: r.ok ? "Quiz supprimé" : r.error });
                        if (r.ok) router.refresh();
                      });
                    }}
                  >
                    <Icon name="delete" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-label text-ink-2">
              Créez votre premier quiz : quelques questions à choix, puis lancez-le pour une classe.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
