import type { SubjectKey } from "./subjects";

/** Créneau : heures décimales (10.25 = 10 h 15). */
export type Lesson = { start: number; end: number; subject: SubjectKey; room: string; cancelled?: boolean };

export const WEEK_DAYS = ["lun. 12 oct.", "mar. 13 oct.", "mer. 14 oct.", "jeu. 15 oct.", "ven. 16 oct."];
/** Index du jour courant dans la semaine (mardi). */
export const TODAY_INDEX = 1;
/** Heure courante de la démo : le cours de 10 h 15 est en cours. */
export const NOW_START = 10.25;

export const DAY_START = 8;
export const DAY_END = 17;

export const TIMETABLE: Lesson[][] = [
  [
    { start: 8, end: 9, subject: "ma", room: "B12" },
    { start: 9, end: 10, subject: "fr", room: "A04" },
    { start: 10.25, end: 11.25, subject: "en", room: "A10" },
    { start: 11.25, end: 12.25, subject: "hg", room: "A04" },
    { start: 13.5, end: 15.5, subject: "eps", room: "Gymnase" },
  ],
  [
    { start: 8, end: 9, subject: "fr", room: "A04" },
    { start: 9, end: 10, subject: "ma", room: "B12" },
    { start: 10.25, end: 12.25, subject: "pc", room: "Labo 2" },
    { start: 13.5, end: 14.5, subject: "es", room: "A12" },
    { start: 14.5, end: 15.5, subject: "techno", room: "C03" },
  ],
  [
    { start: 8, end: 9, subject: "en", room: "A10" },
    { start: 9, end: 10, subject: "hg", room: "A04" },
    { start: 10.25, end: 11.25, subject: "ma", room: "B12" },
    { start: 11.25, end: 12.25, subject: "mu", room: "Salle de musique" },
  ],
  [
    { start: 8, end: 10, subject: "svt", room: "Labo 1" },
    { start: 10.25, end: 11.25, subject: "fr", room: "A04" },
    { start: 11.25, end: 12.25, subject: "es", room: "A12" },
    { start: 13.5, end: 15.5, subject: "ap", room: "Arts" },
    { start: 15.5, end: 16.5, subject: "en", room: "A10" },
  ],
  [
    { start: 8, end: 9, subject: "ma", room: "B12" },
    { start: 9, end: 10, subject: "fr", room: "A04" },
    { start: 10.25, end: 11.25, subject: "hg", room: "A04" },
    { start: 11.25, end: 12.25, subject: "techno", room: "C03", cancelled: true },
    { start: 13.5, end: 14.5, subject: "pc", room: "Labo 2" },
    { start: 14.5, end: 16.5, subject: "eps", room: "Gymnase" },
  ],
];
