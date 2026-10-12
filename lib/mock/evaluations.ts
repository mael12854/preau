import type { EvalLevel } from "@/lib/evaluation";
import type { SubjectKey } from "./subjects";

export type Evaluation = { title: string; date: string; level: EvalLevel };

/** Évaluations du trimestre 1, par matière (élève : Léa Martin, 4e B). */
export const EVALUATIONS: Partial<Record<SubjectKey, Evaluation[]>> = {
  fr: [
    { title: "Dictée", date: "18 sept.", level: "MF" },
    { title: "Rédaction — portrait", date: "2 oct.", level: "MS" },
    { title: "Lecture analytique", date: "9 oct.", level: "MS" },
  ],
  ma: [
    { title: "Calcul mental", date: "15 sept.", level: "TB" },
    { title: "Nombres relatifs", date: "25 sept.", level: "MS" },
    { title: "Contrôle — Fractions", date: "9 oct.", level: "TB" },
  ],
  hg: [
    { title: "Repères chronologiques", date: "22 sept.", level: "MF" },
    { title: "Croquis — la ville", date: "6 oct.", level: "MS" },
  ],
  en: [
    { title: "Oral — present yourself", date: "17 sept.", level: "MS" },
    { title: "Compréhension écrite", date: "5 oct.", level: "TB" },
  ],
  es: [
    { title: "Vocabulaire", date: "24 sept.", level: "MS" },
    { title: "Expression orale", date: "8 oct.", level: "MF" },
  ],
  svt: [
    { title: "TP microscope", date: "29 sept.", level: "MI" },
    { title: "Le vivant et son évolution", date: "7 oct.", level: "MF" },
  ],
  pc: [{ title: "Mesures et incertitudes", date: "30 sept.", level: "MS" }],
  techno: [{ title: "Projet — cahier des charges", date: "1 oct.", level: "TB" }],
  mu: [{ title: "Chant choral", date: "21 sept.", level: "TB" }],
  eps: [
    { title: "Demi-fond", date: "28 sept.", level: "MS" },
    { title: "Badminton", date: "12 oct.", level: "MS" },
  ],
  ap: [{ title: "Autoportrait", date: "23 sept.", level: "MS" }],
};

/** Commentaire du professeur selon le niveau atteint. */
export const COMMENTS: Record<EvalLevel, string> = {
  MI: "Notions à reprendre : venez me voir en fin de cours.",
  MF: "Des bases présentes, à consolider avec les exercices du manuel.",
  MS: "Bon travail, méthode bien appliquée.",
  TB: "Excellent travail, raisonnement clair et rigoureux.",
};

/** Dernières évaluations affichées sur le tableau de bord : [matière, index]. */
export const LAST_EVALUATIONS: [SubjectKey, number][] = [
  ["ma", 2],
  ["fr", 2],
  ["es", 1],
  ["svt", 1],
];

/** Évaluation sélectionnée par défaut dans le panneau de détail. */
export const DEFAULT_SELECTION: { subject: SubjectKey; index: number } = { subject: "ma", index: 2 };

/**
 * Niveau par compétence pour une évaluation : la 2e compétence est décalée d'un niveau
 * (règle du prototype), les autres reprennent le niveau global.
 */
export function skillLevels(level: EvalLevel): [EvalLevel, EvalLevel, EvalLevel] {
  const order: EvalLevel[] = ["MI", "MF", "MS", "TB"];
  const i = order.indexOf(level);
  const shifted = order[Math.max(0, Math.min(3, i + (i < 3 ? 1 : -1)))];
  return [level, shifted, level];
}
