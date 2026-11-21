import "server-only";
import type { SupabaseServer } from "@/lib/supabase/server";
import { classStudents } from "./common";

export type MathAssignmentView = {
  id: string;
  title: string;
  className: string;
  classId: string;
  dueOn: string;
  exerciseIds: string[];
  perExercise: number;
  maxAttempts: number | null;
  toEvaluation: boolean;
};

export type TeacherAssignment = MathAssignmentView & {
  students: { id: string; name: string; best: number | null; attempts: number }[];
};

export type StudentAssignment = MathAssignmentView & { best: number | null; attempts: number };

const FIELDS = "id, title, due_on, exercise_ids, per_exercise, max_attempts, to_evaluation, class_id, classes(name)";

type Row = {
  id: string;
  title: string;
  due_on: string;
  exercise_ids: string[];
  per_exercise: number;
  max_attempts: number | null;
  to_evaluation: boolean;
  class_id: string;
  classes: { name: string } | null;
};
const view = (a: Row): MathAssignmentView => ({
  id: a.id,
  title: a.title,
  className: a.classes?.name ?? "",
  classId: a.class_id,
  dueOn: a.due_on,
  exerciseIds: a.exercise_ids,
  perExercise: a.per_exercise,
  maxAttempts: a.max_attempts,
  toEvaluation: a.to_evaluation,
});

/** Enseignant : ses séries, avec pour chaque élève de la classe sa meilleure note et son nombre d'essais. */
export async function getTeacherAssignments(supabase: SupabaseServer, teacherId: string): Promise<TeacherAssignment[]> {
  const { data } = await supabase
    .from("math_assignments")
    .select(FIELDS)
    .eq("teacher_id", teacherId)
    .is("removed_at", null)
    .order("due_on", { ascending: false })
    .limit(60);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];
  const [{ data: attempts }, rosters] = await Promise.all([
    supabase
      .from("math_attempts")
      .select("assignment_id, student_id, score")
      .in("assignment_id", rows.map((r) => r.id))
      .not("submitted_at", "is", null),
    Promise.all([...new Set(rows.map((r) => r.class_id))].map(async (c) => [c, await classStudents(supabase, c)] as const)),
  ]);
  const roster = new Map(rosters);
  return rows.map((a) => {
    const mine = (attempts ?? []).filter((t) => t.assignment_id === a.id);
    return {
      ...view(a),
      students: (roster.get(a.class_id) ?? []).map((s) => {
        const own = mine.filter((t) => t.student_id === s.id);
        return {
          id: s.id,
          name: s.name,
          attempts: own.length,
          best: own.length ? Math.max(...own.map((t) => Number(t.score ?? 0))) : null,
        };
      }),
    };
  });
}

/** Élève ou famille : séries des classes de l'élève, avec sa meilleure note. */
export async function getStudentAssignments(
  supabase: SupabaseServer,
  studentId: string,
  classIds: string[],
): Promise<StudentAssignment[]> {
  if (!classIds.length) return [];
  const { data } = await supabase
    .from("math_assignments")
    .select(FIELDS)
    .in("class_id", classIds)
    .is("removed_at", null)
    .order("due_on", { ascending: false })
    .limit(60);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];
  const { data: attempts } = await supabase
    .from("math_attempts")
    .select("assignment_id, score")
    .eq("student_id", studentId)
    .in("assignment_id", rows.map((r) => r.id))
    .not("submitted_at", "is", null);
  return rows.map((a) => {
    const own = (attempts ?? []).filter((t) => t.assignment_id === a.id);
    return { ...view(a), attempts: own.length, best: own.length ? Math.max(...own.map((t) => Number(t.score ?? 0))) : null };
  });
}

/** Entraînement libre : les dernières tentatives de l'élève. */
export async function getTrainingHistory(supabase: SupabaseServer, studentId: string) {
  const { data } = await supabase
    .from("math_attempts")
    .select("id, exercise_ids, score, submitted_at")
    .eq("student_id", studentId)
    .is("assignment_id", null)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(10);
  return (data ?? []).map((t) => ({ id: t.id, exerciseIds: t.exercise_ids, score: Number(t.score ?? 0), at: t.submitted_at! }));
}
