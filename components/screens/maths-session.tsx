"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { type Correction, type PublicQuestion, startAttempt, submitAttempt } from "@/app/(app)/exercices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { scoreShort } from "@/lib/grading";

type Mode =
  | { kind: "serie"; assignmentId: string; title: string; attemptsLeft: number | null; best: number | null }
  | { kind: "entrainement"; exerciseIds: string[]; title: string };

const HINT: Record<PublicQuestion["kind"], string> = {
  number: "Un nombre : 12 ; 3,5 ; −4",
  fraction: "Une fraction simplifiée (7/3) ou un entier",
  expr: "Une expression : 3x + 2 ; x² s'écrit x² ou x^2 ; (x+1)(x−1)",
  choice: "",
  text: "",
};

/** Une série d'exercices : on commence, on répond, on rend ; la correction s'affiche et on peut recommencer. */
export function MathsSession({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [attempt, setAttempt] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ good: number; total: number; score: number; correction: Correction } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(mode.kind === "serie" ? mode.attemptsLeft : null);

  const begin = () =>
    start(async () => {
      setError(null);
      const r = await startAttempt(mode.kind === "serie" ? { assignmentId: mode.assignmentId } : { exerciseIds: mode.exerciseIds });
      if (!r.ok) return setError(r.error);
      setAttempt(r.attemptId);
      setQuestions(r.questions);
      setAnswers(r.questions.map(() => ""));
      setResult(null);
      window.scrollTo({ top: 0 });
    });

  const submit = () => {
    if (!attempt) return;
    const empty = answers.filter((a) => !a.trim()).length;
    if (empty && !window.confirm(`${empty} question${empty > 1 ? "s" : ""} sans réponse. Rendre quand même ?`)) return;
    start(async () => {
      const r = await submitAttempt(attempt, answers);
      if (!r.ok) return setError(r.error);
      setResult(r);
      setAttempt(null);
      if (left !== null) setLeft(left - 1);
      window.scrollTo({ top: 0 });
      router.refresh();
    });
  };

  const canRetry = left === null || left > 0;

  // ── Avant de commencer ──
  if (!attempt && !result)
    return (
      <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
        <h2 className="m-0 font-display text-h2 font-bold">{mode.title}</h2>
        {mode.kind === "serie" && (
          <p className="m-0 text-label text-ink-2">
            {mode.best !== null ? `Meilleure note : ${scoreShort(mode.best, "NE")}. ` : ""}
            {left === null ? "Essais illimités." : left > 0 ? `${left} essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}.` : "Plus d'essai disponible."}
          </p>
        )}
        <p className="m-0 text-label text-ink-2">Chaque essai tire de nouvelles valeurs. La correction s&apos;affiche quand vous rendez la série.</p>
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        {canRetry && (
          <Button icon="play_arrow" disabled={pending} onClick={begin} className="h-11 self-start px-5 text-label">
            {pending ? "Préparation…" : "Commencer"}
          </Button>
        )}
      </section>
    );

  // ── Correction ──
  if (result)
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5">
          <div className="flex flex-col gap-1">
            <span className="text-label text-ink-2">{mode.title}</span>
            <b className="font-display text-hello font-extrabold tabular">{scoreShort(result.score, "NE")}</b>
            <span className="text-label text-ink-2">
              {result.good} bonne{result.good > 1 ? "s" : ""} réponse{result.good > 1 ? "s" : ""} sur {result.total}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {canRetry && (
              <Button icon="replay" disabled={pending} onClick={begin} className="h-11 px-4 text-label">
                Recommencer
              </Button>
            )}
            <Link href="/exercices" className="flex h-11 items-center rounded-control border border-line px-4 text-label font-bold hover:border-line-strong">
              Retour aux exercices
            </Link>
          </div>
        </section>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {questions.map((q, i) => {
            const c = result.correction[i];
            return (
              <li key={i} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption text-ink-muted">
                    {i + 1}. {q.exercise}
                  </span>
                  <Badge tone={c.correct ? "ok" : "danger"}>{c.correct ? "Juste" : "Faux"}</Badge>
                </div>
                <p className="m-0 text-ui whitespace-pre-line">{q.prompt}</p>
                <p className="m-0 text-label">
                  Votre réponse : <b>{c.given || "—"}</b>
                  {!c.correct && (
                    <>
                      {" "}· Réponse attendue : <b>{c.answer.replace(/-/g, "−").replace(/\./g, ",")}</b>
                      {c.unit ? ` ${c.unit}` : ""}
                    </>
                  )}
                </p>
                <p className="m-0 rounded-control bg-surface-2 px-3 py-2 text-label whitespace-pre-line text-ink-2">{c.solution}</p>
              </li>
            );
          })}
        </ol>
      </div>
    );

  // ── Questions ──
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h2 className="m-0 font-display text-h2 font-bold">{mode.title}</h2>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {questions.map((q, i) => (
          <li key={i} className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-4">
            <span className="text-caption text-ink-muted">
              Question {i + 1} / {questions.length} · {q.exercise}
            </span>
            <p id={`q-${i}`} className="m-0 text-ui whitespace-pre-line">
              {q.prompt}
            </p>
            {q.kind === "choice" ? (
              <div role="radiogroup" aria-labelledby={`q-${i}`} className="flex flex-wrap gap-2">
                {q.choices!.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={answers[i] === c}
                    onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? c : x)))}
                    className="min-h-11 rounded-control border-[1.5px] border-line px-4 text-label font-bold aria-checked:border-brand aria-checked:bg-brand aria-checked:text-on-brand"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <input
                    aria-labelledby={`q-${i}`}
                    value={answers[i]}
                    onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                    inputMode={q.kind === "expr" ? "text" : "decimal"}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="h-11 w-full max-w-72 rounded-control border border-line-strong bg-surface px-3 text-ui tabular"
                  />
                  {q.unit && <span className="text-label text-ink-2">{q.unit}</span>}
                </span>
                <span className="text-caption text-ink-muted">{HINT[q.kind]}</span>
              </label>
            )}
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <span className="text-caption text-ink-muted">
          <Icon name="info" size={16} /> Vous pourrez voir la correction après avoir rendu.
        </span>
        <Button type="submit" disabled={pending} className="h-11 px-5 text-label">
          {pending ? "Correction…" : "Rendre la série"}
        </Button>
      </div>
    </form>
  );
}
