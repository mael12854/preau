"use server";

import { revalidatePath } from "next/cache";
import { buildQuestions, exerciseById } from "@/lib/maths/catalog";
import { type AnswerKind, isCorrect, scoreOf } from "@/lib/maths/core";
import { getViewer } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const FAILED = "L'enregistrement n'a pas abouti. Réessayez dans un instant.";
const readable = (m: string) =>
  /^[A-ZÉÈÀ0-9]/.test(m) && !/permission|violates|syntax|relation|column|function|constraint|null value/i.test(m) ? m : FAILED;

/** Énoncé envoyé au navigateur : jamais la réponse. */
export type PublicQuestion = { prompt: string; kind: AnswerKind; choices?: string[]; unit?: string; exercise: string };
export type Correction = { correct: boolean; given: string; answer: string; solution: string; unit?: string }[];

/** Enseignant : donner une série d'exercices à une classe. */
export async function createMathAssignment(input: {
  classId: string;
  title: string;
  exerciseIds: string[];
  perExercise: number;
  due: string;
  maxAttempts: number | null;
  toEvaluation: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ids = [...new Set(input.exerciseIds)].filter((id) => exerciseById.has(id));
  if (!ids.length) return { ok: false, error: "Choisissez au moins un exercice." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_math_assignment", {
    p_class: input.classId,
    p_title: input.title,
    p_exercises: ids,
    p_per: input.perExercise,
    p_due: input.due,
    p_max: input.maxAttempts as number,
    p_to_eval: input.toEvaluation,
    // Compétences de l'évaluation (établissements par compétences) : un exercice = une compétence.
    p_skills: ids.slice(0, 12).map((id) => exerciseById.get(id)!.title),
  });
  if (error) return { ok: false, error: readable(error.message) };
  revalidatePath("/exercices");
  return { ok: true };
}

export async function removeMathAssignment(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_math_assignment", { p_id: id });
  if (error) return { ok: false, error: readable(error.message) };
  revalidatePath("/exercices");
  return { ok: true };
}

/** Élève connecté (seul un élève fait les exercices ; les familles consultent). */
async function currentStudent() {
  const viewer = await getViewer();
  if (!viewer || !["college", "lycee", "primaire"].includes(viewer.id)) return null;
  return viewer.profileId;
}

/**
 * Commencer une tentative : une série donnée par l'enseignant (avec ses règles), ou un entraînement libre
 * sur quelques exercices choisis. La graine est tirée et gardée côté serveur.
 */
export async function startAttempt(input: { assignmentId?: string; exerciseIds?: string[] }): Promise<
  { ok: true; attemptId: string; questions: PublicQuestion[] } | { ok: false; error: string }
> {
  const student = await currentStudent();
  const admin = createAdminClient();
  if (!student || !admin) return { ok: false, error: "Seul un élève peut faire les exercices." };
  let exerciseIds: string[];
  let per: number;
  let assignmentId: string | null = null;
  if (input.assignmentId) {
    // La RLS vérifie que la série concerne bien la classe de l'élève.
    const supabase = await createClient();
    const { data: a } = await supabase
      .from("math_assignments")
      .select("id, exercise_ids, per_exercise, max_attempts")
      .eq("id", input.assignmentId)
      .maybeSingle();
    if (!a) return { ok: false, error: "Série introuvable." };
    if (a.max_attempts) {
      const { count } = await admin
        .from("math_attempts")
        .select("id", { count: "exact", head: true })
        .eq("assignment_id", a.id)
        .eq("student_id", student)
        .not("submitted_at", "is", null);
      if ((count ?? 0) >= a.max_attempts) return { ok: false, error: "Vous avez utilisé tous vos essais pour cette série." };
    }
    exerciseIds = a.exercise_ids;
    per = a.per_exercise;
    assignmentId = a.id;
  } else {
    exerciseIds = [...new Set(input.exerciseIds ?? [])].filter((id) => exerciseById.has(id)).slice(0, 5);
    if (!exerciseIds.length) return { ok: false, error: "Choisissez au moins un exercice." };
    per = exerciseIds.length === 1 ? 8 : 4;
  }
  const seed = Math.floor(Math.random() * 2 ** 31);
  const { data: row, error } = await admin
    .from("math_attempts")
    .insert({ assignment_id: assignmentId, student_id: student, exercise_ids: exerciseIds, per_exercise: per, seed })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: FAILED };
  const questions = buildQuestions(exerciseIds, per, seed).map((q) => ({
    prompt: q.prompt,
    kind: q.kind,
    choices: q.choices,
    unit: q.unit,
    exercise: exerciseById.get(q.exerciseId)?.title ?? "",
  }));
  return { ok: true, attemptId: row.id, questions };
}

/** Rendre une tentative : le serveur recorrige à partir de la graine, enregistre, et reporte la meilleure note. */
export async function submitAttempt(
  attemptId: string,
  answers: string[],
): Promise<{ ok: true; good: number; total: number; score: number; correction: Correction } | { ok: false; error: string }> {
  const student = await currentStudent();
  const admin = createAdminClient();
  if (!student || !admin) return { ok: false, error: FAILED };
  const { data: at } = await admin.from("math_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!at || at.student_id !== student) return { ok: false, error: "Tentative introuvable." };
  if (at.submitted_at) return { ok: false, error: "Cette série a déjà été rendue." };
  const questions = buildQuestions(at.exercise_ids, at.per_exercise, Number(at.seed));
  const given = questions.map((_, i) => String(answers[i] ?? "").slice(0, 200));
  const results = questions.map((q, i) => isCorrect(q, given[i]));
  const good = results.filter(Boolean).length;
  const score = scoreOf(good, questions.length);
  const { error } = await admin
    .from("math_attempts")
    .update({ answers: given, results, good, total: questions.length, score, submitted_at: new Date().toISOString() })
    .eq("id", attemptId)
    .is("submitted_at", null);
  if (error) return { ok: false, error: FAILED };

  // Note dans les évaluations : la meilleure tentative de l'élève sur cette série.
  if (at.assignment_id) {
    const { data: a } = await admin
      .from("math_assignments")
      .select("assessment_id, exercise_ids, per_exercise, classes(schools(grading))")
      .eq("id", at.assignment_id)
      .maybeSingle();
    if (a?.assessment_id) {
      const { data: best } = await admin
        .from("math_attempts")
        .select("score, results, exercise_ids, per_exercise")
        .eq("assignment_id", at.assignment_id)
        .eq("student_id", student)
        .not("submitted_at", "is", null)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (best) {
        const note20 = (a.classes as { schools: { grading: string } | null } | null)?.schools?.grading === "note20";
        const level = (ratio: number) => (ratio >= 0.75 ? "TB" : ratio >= 0.5 ? "MS" : ratio >= 0.25 ? "MF" : "MI");
        const res = (best.results as boolean[]) ?? [];
        // Une compétence par exercice (12 au plus) : part de bonnes réponses sur ses questions.
        const skillLevels = best.exercise_ids.slice(0, 12).map((_, k) => {
          const part = res.slice(k * best.per_exercise, (k + 1) * best.per_exercise);
          return level(part.filter(Boolean).length / Math.max(1, part.length));
        });
        await admin.from("assessment_results").upsert(
          {
            assessment_id: a.assessment_id,
            student_id: student,
            score: Number(best.score),
            level: note20 ? "NE" : level(Number(best.score) * 0.05),
            skill_levels: note20 ? [] : skillLevels,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "assessment_id,student_id" },
        );
      }
    }
  }
  revalidatePath("/exercices");
  revalidatePath("/evaluations");
  return {
    ok: true,
    good,
    total: questions.length,
    score,
    correction: questions.map((q, i) => ({ correct: results[i], given: given[i], answer: q.answer, solution: q.solution, unit: q.unit })),
  };
}
