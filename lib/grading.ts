/**
 * Mode de notation d'un établissement. Par défaut : compétences (pastilles, jamais de note).
 * Un établissement réglé sur « note20 » note chaque évaluation sur 20 — sans moyenne ni rang.
 */
import { EVAL_META, type EvalValue } from "./evaluation";

export type Grading = "competences" | "note20";

/** 14.5 → « 14,5 » ; 12 → « 12 ». */
export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1).replace(".", ",");
}

/** Texte court d'un résultat noté : « 14,5/20 », « Abs. », « Disp. », « — ». */
export function scoreShort(score: number | null, status: EvalValue): string {
  if (score !== null) return `${formatScore(score)}/20`;
  return status === "ABS" || status === "DISP" ? EVAL_META[status].short : "—";
}

/** Texte complet, pour les lecteurs d'écran : « 14,5 sur 20 », « Absent », « Non noté ». */
export function scoreLabel(score: number | null, status: EvalValue): string {
  if (score !== null) return `${formatScore(score)} sur 20`;
  return status === "ABS" || status === "DISP" ? EVAL_META[status].label : "Non noté";
}

/** Saisie : « 14,5 » ou « 14.5 » → 14.5 ; vide → null ; hors barème ou pas au demi-point → undefined. */
export function parseScore(input: string): number | null | undefined {
  const t = input.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 20 || Math.round(n * 2) !== n * 2) return undefined;
  return n;
}
