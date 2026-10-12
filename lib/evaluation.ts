/**
 * Évaluation par compétences : 4 niveaux, jamais de note chiffrée.
 * Ordre fixe MI → TB. Ces couleurs sont réservées aux évaluations.
 */
export type EvalLevel = "MI" | "MF" | "MS" | "TB";
export type EvalAbsence = "NE" | "ABS" | "DISP";
export type EvalValue = EvalLevel | EvalAbsence;

export const EVAL_LEVELS: readonly EvalLevel[] = ["MI", "MF", "MS", "TB"];

type EvalMeta = {
  /** Sigle affiché dans les grilles et sur les pastilles. */
  short: string;
  /** Libellé complet, toujours repris dans l'aria-label. */
  label: string;
  /** Libellé court pour les légendes. */
  legend: string;
  /** Variable CSS de couleur, ou null pour un cercle vide. */
  color: string | null;
};

export const EVAL_META: Record<EvalValue, EvalMeta> = {
  MI: { short: "MI", label: "Maîtrise insuffisante", legend: "Insuffisante", color: "var(--eval-mi)" },
  MF: { short: "MF", label: "Maîtrise fragile", legend: "Fragile", color: "var(--eval-mf)" },
  MS: { short: "MS", label: "Maîtrise satisfaisante", legend: "Satisfaisante", color: "var(--eval-ms)" },
  TB: { short: "TB", label: "Très bonne maîtrise", legend: "Très bonne", color: "var(--eval-tb)" },
  NE: { short: "NE", label: "Non évalué", legend: "Non évalué", color: null },
  ABS: { short: "Abs.", label: "Absent", legend: "Absent", color: null },
  DISP: { short: "Disp.", label: "Dispensé", legend: "Dispensé", color: null },
};

/** Cycle de saisie du professeur : NE → MI → MF → MS → TB → NE. */
export function nextEvalValue(value: EvalValue): EvalValue {
  if (value === "TB") return "NE";
  if (value === "NE" || value === "ABS" || value === "DISP") return "MI";
  return EVAL_LEVELS[EVAL_LEVELS.indexOf(value) + 1];
}

/** Compte les pastilles par niveau, dans l'ordre MI → TB (pour la barre de répartition). */
export function distribution(values: readonly EvalValue[]): { level: EvalLevel; count: number }[] {
  return EVAL_LEVELS.map((level) => ({ level, count: values.filter((v) => v === level).length }));
}
