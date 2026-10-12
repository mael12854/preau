import type { EvalValue } from "@/lib/evaluation";

/** Classe de 4e D, cours de mathématiques de M. Durand. */
export const CLASS_SESSION = {
  label: "4e D · Mathématiques",
  detail: "mar. 13 oct. · 10 h 15 – 11 h 15 · Salle B12",
  evaluation: "Contrôle — Fractions",
  skills: ["Calculer", "Raisonner", "Communiquer"] as const,
};

export const STUDENTS = [
  "Adam Bernard", "Inès Chevalier", "Noah Dupuis", "Lina Faure", "Gabriel Girard", "Jade Henry",
  "Louis Lambert", "Léa Martin", "Rayan Mercier", "Chloé Morel", "Sacha Perrin", "Zoé Robin",
];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("");

export type Attendance = "present" | "absent" | "late";

export const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: "present", label: "Présent" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Retard" },
];

export function defaultAttendance(): Record<string, Attendance> {
  const a: Record<string, Attendance> = {};
  STUDENTS.forEach((n) => (a[n] = "present"));
  a["Noah Dupuis"] = "absent";
  a["Sacha Perrin"] = "late";
  return a;
}

const LEVELS: EvalValue[] = ["MI", "MF", "MS", "TB"];

/** Grille de saisie initiale (élèves × compétences), reprise du prototype. */
export function defaultGrid(): Record<string, EvalValue[]> {
  const g: Record<string, EvalValue[]> = {};
  STUDENTS.forEach((n, i) => {
    g[n] = [LEVELS[(i * 3 + 1) % 4], LEVELS[(i * 2 + 2) % 4], i % 5 === 0 ? "NE" : LEVELS[(i + 2) % 4]];
  });
  return g;
}
