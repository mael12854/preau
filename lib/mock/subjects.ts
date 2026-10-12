import { SUBJECT_HUES } from "@/lib/subjects";

export type SubjectKey = "fr" | "hg" | "eps" | "svt" | "pc" | "techno" | "ma" | "es" | "en" | "mu" | "ap";

export type Subject = {
  key: SubjectKey;
  name: string;
  hue: number;
  prof: string;
  /** Compétences évaluées dans la matière. */
  skills: [string, string, string];
};

const H = SUBJECT_HUES;

export const SUBJECTS: Record<SubjectKey, Subject> = {
  fr: { key: "fr", name: "Français", hue: H.francais, prof: "Mme Petit", skills: ["Lire", "Écrire", "Étude de la langue"] },
  hg: { key: "hg", name: "Histoire-Géo", hue: H.histoireGeo, prof: "M. Garnier", skills: ["Se repérer", "Raisonner", "Analyser un document"] },
  eps: { key: "eps", name: "EPS", hue: H.eps, prof: "M. Colin", skills: ["Performance", "Coopérer", "Méthodes"] },
  svt: { key: "svt", name: "SVT", hue: H.svt, prof: "Mme Ndiaye", skills: ["Pratiquer une démarche", "Modéliser", "Communiquer"] },
  pc: { key: "pc", name: "Physique-Chimie", hue: H.physiqueChimie, prof: "M. Roche", skills: ["Mesurer", "Modéliser", "Communiquer"] },
  techno: { key: "techno", name: "Technologie", hue: H.techno, prof: "Mme Faure", skills: ["Concevoir", "Réaliser", "Communiquer"] },
  ma: { key: "ma", name: "Mathématiques", hue: H.maths, prof: "M. Durand", skills: ["Calculer", "Raisonner", "Communiquer"] },
  es: { key: "es", name: "Espagnol", hue: H.lv2, prof: "Mme Ortiz", skills: ["Comprendre", "S'exprimer à l'oral", "Écrire"] },
  en: { key: "en", name: "Anglais", hue: H.anglais, prof: "Mrs Clarke", skills: ["Comprendre", "S'exprimer à l'oral", "Écrire"] },
  mu: { key: "mu", name: "Musique", hue: H.musique, prof: "M. Blanc", skills: ["Chanter", "Écouter", "Créer"] },
  ap: { key: "ap", name: "Arts plastiques", hue: H.arts, prof: "Mme Lemoine", skills: ["Expérimenter", "Représenter", "S'exprimer"] },
};

export const subject = (k: SubjectKey) => SUBJECTS[k];
