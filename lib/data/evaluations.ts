import "server-only";
import type { EvalValue } from "@/lib/evaluation";
import { formatDayMonth } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import { getTeachers } from "./common";
import type { LastEvaluationView, SubjectEvaluationsView } from "./types";

/** Évaluations publiées d'un élève, par matière (la RLS ne renvoie que ce qui est visible). */
export async function getStudentEvaluations(
  supabase: SupabaseServer,
  studentId: string,
  classId: string,
) {
  const [{ data }, teachers] = await Promise.all([
    supabase
      .from("assessment_results")
      .select(
        "level, score, skill_levels, comment, assessments!inner(id, title, held_on, term, skills, published_at, subjects(id, name, hue))",
      )
      .eq("student_id", studentId)
      .not("assessments.published_at", "is", null),
    getTeachers(supabase, classId),
  ]);

  const bySubject = new Map<string, SubjectEvaluationsView>();
  const rows = (data ?? []).sort((a, b) =>
    a.assessments.held_on.localeCompare(b.assessments.held_on),
  );
  for (const r of rows) {
    const a = r.assessments;
    const s = a.subjects!;
    if (!bySubject.has(s.id))
      bySubject.set(s.id, {
        subject: { id: s.id, name: s.name, hue: s.hue },
        prof: teachers[s.id] ?? "",
        evaluations: [],
      });
    bySubject.get(s.id)!.evaluations.push({
      id: a.id,
      title: a.title,
      date: formatDayMonth(a.held_on),
      level: r.level,
      score: r.score,
      skills: a.skills.map((name, i) => ({
        name,
        level: (r.skill_levels[i] ?? "NE") as EvalValue,
      })),
      comment: r.comment,
      term: a.term,
    });
  }
  return [...bySubject.values()];
}

/** Les dernières évaluations publiées (tableau de bord). */
export async function getLastEvaluations(
  supabase: SupabaseServer,
  studentId: string,
  limit = 4,
): Promise<LastEvaluationView[]> {
  const { data } = await supabase
    .from("assessment_results")
    .select(
      "level, score, assessments!inner(id, title, held_on, published_at, subjects(name))",
    )
    .eq("student_id", studentId)
    .not("assessments.published_at", "is", null);
  return (data ?? [])
    .sort(
      (a, b) =>
        b.assessments.held_on.localeCompare(a.assessments.held_on) ||
        a.assessments.title.localeCompare(b.assessments.title),
    )
    .slice(0, limit)
    .map((r) => ({
      id: r.assessments.id,
      title: r.assessments.title,
      subject: r.assessments.subjects?.name ?? "",
      date: formatDayMonth(r.assessments.held_on),
      level: r.level,
      score: r.score,
    }));
}
