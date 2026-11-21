import "server-only";
import { COURS_1, type Lesson } from "./cours1";
import { COURS_2 } from "./cours2";

/** Leçons de maths, réservées aux enseignants (jamais envoyées aux élèves). */
export const LESSONS = new Map<string, Lesson>([...COURS_1, ...COURS_2].map((l) => [l.chapter, l]));
export type { Bloc, Lesson } from "./cours1";
