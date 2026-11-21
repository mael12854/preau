import { type Exercise, type Question, Rng, questionSeed } from "./core";
import { PRIMAIRE } from "./exercices/primaire";
import { COLLEGE_1 } from "./exercices/college1";
import { COLLEGE_2 } from "./exercices/college2";

/** Toute la banque d'exercices, du CP à la seconde. */
export const EXERCISES: Exercise[] = [...PRIMAIRE, ...COLLEGE_1, ...COLLEGE_2];
export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));

/**
 * Questions d'une série : chaque exercice choisi donne `perExercise` questions, tirées de la graine.
 * Même graine ⇒ mêmes questions (le serveur recorrige ainsi sans stocker les énoncés).
 */
export function buildQuestions(exerciseIds: string[], perExercise: number, seed: number): (Question & { exerciseId: string })[] {
  const out: (Question & { exerciseId: string })[] = [];
  let i = 0;
  for (const id of exerciseIds) {
    const e = exerciseById.get(id);
    if (!e) continue;
    for (let k = 0; k < perExercise; k++) out.push({ ...e.make(new Rng(questionSeed(seed, i++))), exerciseId: id });
  }
  return out;
}
