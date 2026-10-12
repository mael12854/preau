import type { SubjectKey } from "./subjects";

export type Homework = {
  id: string;
  subject: SubjectKey;
  text: string;
  given: string;
  exam?: boolean;
  file?: string;
};

export type HomeworkDay = { day: string; items: Homework[] };

export const HOMEWORK: HomeworkDay[] = [
  {
    day: "Pour mercredi 14 octobre",
    items: [
      { id: "0-0", subject: "ma", text: "Exercices 12 à 15 page 84, sur feuille double.", given: "12 oct." },
      { id: "0-1", subject: "en", text: "Apprendre le vocabulaire de l'unité 3.", given: "9 oct." },
      { id: "0-2", subject: "hg", text: "Relire la leçon sur la Révolution française.", given: "12 oct." },
    ],
  },
  {
    day: "Pour jeudi 15 octobre",
    items: [
      { id: "1-0", subject: "svt", text: "Compte rendu du TP microscope.", given: "7 oct.", file: "Fiche-TP-microscope.pdf" },
      { id: "1-1", subject: "fr", text: "Lire les chapitres 4 et 5 du Petit Prince.", given: "6 oct." },
    ],
  },
  {
    day: "Pour vendredi 16 octobre",
    items: [{ id: "2-0", subject: "hg", text: "La Révolution française, chapitre 2.", given: "5 oct.", exam: true }],
  },
];

/** Devoirs déjà cochés au chargement. */
export const HOMEWORK_DONE_DEFAULT: string[] = ["0-0"];
