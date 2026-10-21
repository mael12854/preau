"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { answerQuiz, getQuizState, quizStep, quizToAssessment } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type State = {
  id: string;
  title: string;
  status: "lobby" | "question" | "reveal" | "ended";
  current: number;
  total: number;
  host: boolean;
  assessmentId: string | null;
  remainingMs: number | null;
  players: number;
  question: {
    prompt: string;
    choices: string[];
    seconds: number;
    correct: number | null;
    counts: number[] | null;
    answered: number;
    mine: number | null;
  } | null;
  /** Résultats sans classement : tous (par ordre alphabétique) pour le professeur, les siens pour l'élève. */
  results: { name: string; me: boolean; points: number; answered: number }[] | null;
};

const LETTERS = ["A", "B", "C", "D"];
const TILE = [
  "border-info bg-info-bg text-info",
  "border-warn bg-warn-bg text-warn",
  "border-ok bg-ok-bg text-ok",
  "border-danger bg-danger-bg text-danger",
];

/** Partie de quiz : écran du professeur (à projeter) ou de l'élève, synchronisés toutes les secondes. */
export function QuizPlay({ sessionId, subjects }: { sessionId: string; subjects: { value: string; label: string }[] }) {
  const toast = useToast();
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [pending, start] = useTransition();
  const deadline = useRef(0);
  const autoRevealed = useRef(-1);

  const refresh = useCallback(async () => {
    const r = await getQuizState(sessionId);
    if (!r.ok) return setError(r.error);
    const s = r.state as State;
    setState(s);
    if (s.status === "question" && s.remainingMs !== null) deadline.current = Date.now() + s.remainingMs;
  }, [sessionId]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const t = setInterval(refresh, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [refresh]);

  // Compte à rebours local ; côté professeur, la réponse s'affiche seule à la fin du temps ou quand tout le monde a répondu.
  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, deadline.current - Date.now());
      setLeft(Math.ceil(ms / 1000));
      if (
        state?.host &&
        state.status === "question" &&
        autoRevealed.current !== state.current &&
        (ms === 0 || (state.question && state.players > 0 && state.question.answered >= state.players))
      ) {
        autoRevealed.current = state.current;
        quizStep(sessionId, "reveal").then(refresh);
      }
    }, 250);
    return () => clearInterval(t);
  }, [state, sessionId, refresh]);

  const step = (action: "next" | "reveal" | "end") =>
    start(async () => {
      const r = await quizStep(sessionId, action);
      if (!r.ok) toast({ title: r.error });
      await refresh();
    });

  if (error)
    return <p className="m-0 rounded-card border border-line bg-surface px-5 py-10 text-center text-ui text-ink-2">{error}</p>;
  if (!state) return <p className="m-0 px-5 py-10 text-center text-ui text-ink-2">Chargement…</p>;

  const q = state.question;
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col">
        <b className="font-display text-h3">{state.title}</b>
        <span className="text-caption text-ink-muted">
          {state.status === "lobby" || state.status === "ended"
            ? `${state.total} question${state.total > 1 ? "s" : ""}`
            : `Question ${state.current} sur ${state.total}`}
        </span>
      </div>
      {state.status === "question" && (
        <span role="timer" aria-label={`${left} secondes`} className="font-display text-[2.5rem] leading-none font-bold tabular text-brand">
          {left}
        </span>
      )}
    </div>
  );

  // ===== Fin de partie =====
  if (state.status === "ended")
    return (
      <div className="flex flex-col gap-4">
        {header}
        <Results results={state.results ?? []} total={state.total} host={state.host} />
        {state.host && <SendResults state={state} subjects={subjects} onDone={refresh} />}
        <Link href="/outils/quiz" className="w-fit text-label font-bold text-brand hover:underline">
          ← Retour aux quiz
        </Link>
      </div>
    );

  // ===== Salle d'attente =====
  if (state.status === "lobby")
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface px-5 py-12 text-center">
          <Icon name="quiz" size={48} className="text-brand" />
          {state.host ? (
            <>
              <p className="m-0 max-w-lg text-ui text-ink-2">
                Les élèves ouvrent <b>Outils → Quiz en direct</b> sur Préau : la partie y apparaît, sans code à taper.
                Les {state.players} élèves de la classe peuvent jouer.
              </p>
              <Button icon="play_arrow" className="h-12 px-6" disabled={pending} onClick={() => step("next")}>
                Commencer
              </Button>
            </>
          ) : (
            <p aria-live="polite" className="m-0 text-h3 font-bold">
              Vous êtes dans la partie. Le professeur va commencer…
            </p>
          )}
        </div>
      </div>
    );

  if (!q) return null;
  const reveal = state.status === "reveal";

  // ===== Question (professeur) =====
  if (state.host)
    return (
      <div className="flex flex-col gap-4">
        {header}
        <p className="m-0 rounded-card border border-line bg-surface px-6 py-8 text-center font-display text-[clamp(1.5rem,4vw,2.5rem)] leading-tight font-bold">
          {q.prompt}
        </p>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {q.choices.map((c, k) => (
            <li
              key={k}
              className={cn(
                "flex items-center gap-3 rounded-card border-2 px-5 py-4 text-h3 font-bold",
                TILE[k],
                reveal && q.correct !== k && "opacity-40",
              )}
            >
              <span aria-hidden="true">{LETTERS[k]}</span>
              <span className="flex-1 text-ink">{c}</span>
              {reveal && q.correct === k && <Icon name="check_circle" size={28} />}
              {q.counts && <span className="tabular">{q.counts[k]}</span>}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-label text-ink-2">
            {q.answered} réponse{q.answered > 1 ? "s" : ""} sur {state.players}
          </span>
          <span className="flex gap-2">
            <Button variant="secondary" className="h-11 px-4 text-label" disabled={pending} onClick={() => step("end")}>
              Arrêter
            </Button>
            {reveal ? (
              <Button icon="arrow_forward" className="h-11 px-5" disabled={pending} onClick={() => step("next")}>
                {state.current >= state.total ? "Voir les résultats" : "Question suivante"}
              </Button>
            ) : (
              <Button className="h-11 px-5" disabled={pending} onClick={() => step("reveal")}>
                Afficher la réponse
              </Button>
            )}
          </span>
        </div>
      </div>
    );

  // ===== Question (élève) =====
  const answered = q.mine !== null;
  return (
    <div className="flex flex-col gap-4">
      {header}
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-6 text-center font-display text-h2 font-bold">{q.prompt}</p>
      <div role="group" aria-label="Réponses" className="grid gap-3 sm:grid-cols-2">
        {q.choices.map((c, k) => (
          <button
            key={k}
            type="button"
            disabled={answered || reveal || pending}
            aria-pressed={q.mine === k}
            onClick={() =>
              start(async () => {
                const r = await answerQuiz(sessionId, k);
                if (!r.ok) toast({ title: r.error });
                await refresh();
              })
            }
            className={cn(
              "flex min-h-20 items-center gap-3 rounded-card border-2 px-5 py-4 text-left text-h3 font-bold disabled:cursor-default",
              TILE[k],
              (answered || reveal) && q.mine !== k && !(reveal && q.correct === k) && "opacity-40",
              q.mine === k && "ring-4 ring-brand/40",
            )}
          >
            <span aria-hidden="true">{LETTERS[k]}</span>
            <span className="flex-1 text-ink">{c}</span>
            {reveal && q.correct === k && <Icon name="check_circle" size={28} />}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 text-center text-h3 font-bold">
        {reveal
          ? q.mine === null
            ? "Pas de réponse cette fois."
            : q.mine === q.correct
              ? "Bonne réponse !"
              : `Raté : la bonne réponse était ${LETTERS[q.correct ?? 0]}.`
          : answered
            ? "Réponse envoyée. Attendez la correction…"
            : ""}
      </p>
      {reveal && state.results?.[0] && (
        <p className="m-0 text-center text-label text-ink-2">
          Vous en êtes à {state.results[0].points} bonne{state.results[0].points > 1 ? "s" : ""} réponse
          {state.results[0].points > 1 ? "s" : ""} sur {state.current}.
        </p>
      )}
    </div>
  );
}

function Results({ results, total, host }: { results: NonNullable<State["results"]>; total: number; host: boolean }) {
  if (!results.length) return <p className="m-0 text-label text-ink-2">Aucune réponse.</p>;
  if (!host) {
    const r = results[0];
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-5 py-10 text-center">
        <Icon name="check_circle" size={40} className="text-ok" />
        <p className="m-0 text-h2 font-bold">
          {r.points} bonne{r.points > 1 ? "s" : ""} réponse{r.points > 1 ? "s" : ""} sur {total}
        </p>
        <p className="m-0 text-label text-ink-2">Merci d&apos;avoir participé !</p>
      </div>
    );
  }
  return (
    <ul aria-label="Résultats par élève" className="m-0 flex list-none flex-col overflow-hidden rounded-card border border-line bg-surface p-0">
      {results.map((r, i) => (
        <li key={`${r.name}-${i}`} className="flex items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0">
          <span className="flex-1 text-ui font-bold">{r.name}</span>
          <span className="text-ui tabular">
            {r.points} bonne{r.points > 1 ? "s" : ""} réponse{r.points > 1 ? "s" : ""} sur {total}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Fin de partie : les résultats deviennent une évaluation de la classe (non publiée, modifiable). */
function SendResults({ state, subjects, onDone }: { state: State; subjects: { value: string; label: string }[]; onDone: () => void }) {
  const toast = useToast();
  const [subject, setSubject] = useState(subjects[0]?.value ?? "");
  const [skill, setSkill] = useState(state.title);
  const [pending, start] = useTransition();
  if (state.assessmentId)
    return (
      <p className="m-0 rounded-card border border-line bg-surface px-5 py-4 text-label">
        Résultats envoyés.{" "}
        <Link href={`/appel?evaluation=${state.assessmentId}`} className="font-bold text-brand hover:underline">
          Voir l&apos;évaluation
        </Link>{" "}
        (à vérifier puis publier).
      </p>
    );
  if (!subjects.length || !state.results?.length) return null;
  return (
    <form
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await quizToAssessment(state.id, subject, skill);
          toast({ title: r.ok ? "Résultats envoyés dans une évaluation" : r.error });
          onDone();
        });
      }}
    >
      <b className="text-ui">Envoyer les résultats dans une évaluation</b>
      <p className="m-0 text-caption leading-[1.45] text-ink-2">
        Notes sur 20 : le pourcentage de bonnes réponses est ramené sur 20. Compétences : 90 % et plus = très bonne maîtrise,
        70 % = maîtrise satisfaisante, 40 % = fragile, en dessous = insuffisante. L&apos;évaluation n&apos;est pas publiée :
        vous pouvez tout vérifier avant.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <SelectField label="Matière" options={subjects} value={subject} onValueChange={setSubject} className="min-w-44" />
        <TextField label="Compétence évaluée" value={skill} maxLength={120} onChange={(e) => setSkill(e.target.value)} />
        <Button type="submit" disabled={pending} className="h-12 px-5">
          {pending ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}
