import "server-only";
import type { EvalLevel } from "@/lib/evaluation";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { classStudents } from "./common";
import { getPublishTargets } from "./targets";

export type ReportEditorView = {
  classes: { id: string; name: string }[];
  classId: string | null;
  term: number;
  /** Direction et secrétariat préparent les bulletins de la classe. */
  canPrepare: boolean;
  /** La direction rédige l'avis du conseil de classe. */
  canCouncil: boolean;
  subjects: { id: string; name: string }[];
  students: {
    id: string;
    name: string;
    reportCardId: string | null;
    publishOn: string | null;
    lines: Record<string, { level: EvalLevel | null; comment: string; score: number | null }>;
    council: { mention: string; text: string };
  }[];
};

/** Saisie des bulletins d'une classe pour un trimestre : élèves, matières modifiables, lignes déjà écrites. */
export async function getReportEditor(
  supabase: SupabaseServer,
  profile: Viewer,
  classParam: string | undefined,
  term: number,
): Promise<ReportEditorView | null> {
  const targets = await getPublishTargets(supabase, profile);
  if (!targets) return null;
  const canPrepare = profile.id === "direction" || profile.id === "secretariat";
  const canCouncil = profile.id === "direction";
  const classId =
    targets.classes.find((c) => c.id === classParam)?.id ??
    targets.classes[0]?.id ??
    null;
  const base = {
    classes: targets.classes,
    classId,
    term,
    canPrepare,
    canCouncil,
    subjects: [],
    students: [],
  };
  if (!classId) return base;

  const year = profile.school.year.replace(/^\D*/, "");
  const [students, { data: teachings }, { data: klass }] = await Promise.all([
    classStudents(supabase, classId),
    supabase
      .from("teachings")
      .select("subject_id, teacher_id, subjects(name)")
      .eq("class_id", classId),
    supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .maybeSingle(),
  ]);
  // Le professeur ne remplit que ses matières (toutes, s'il est titulaire de la classe) ; la direction, toutes.
  const titular = klass?.teacher_id === profile.profileId;
  const subjects = [
    ...new Map(
      (teachings ?? [])
        .filter(
          (t) => canCouncil || titular || t.teacher_id === profile.profileId,
        )
        .map((t) => [
          t.subject_id,
          { id: t.subject_id, name: t.subjects?.name ?? t.subject_id },
        ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const ids = students.map((s) => s.id);
  const { data: cards } = ids.length
    ? await supabase
        .from("report_cards")
        .select(
          "id, student_id, publish_on, council_mention, council_text, report_card_lines(subject_id, level, comment, score)",
        )
        .in("student_id", ids)
        .eq("school_year", year)
        .eq("term", term)
    : { data: [] };
  const byStudent = new Map((cards ?? []).map((c) => [c.student_id, c]));

  return {
    ...base,
    subjects,
    // Déjà triés par nom (classStudents).
    students: students.map((s) => {
      const card = byStudent.get(s.id);
      return {
        id: s.id,
        name: s.name,
        reportCardId: card?.id ?? null,
        publishOn: card?.publish_on ?? null,
        lines: Object.fromEntries(
          (card?.report_card_lines ?? []).map((l) => [
            l.subject_id,
            {
              level:
                l.level === "MI" ||
                l.level === "MF" ||
                l.level === "MS" ||
                l.level === "TB"
                  ? l.level
                  : null,
              comment: l.comment,
              score: l.score === null ? null : Number(l.score),
            },
          ]),
        ),
        council: {
          mention: card?.council_mention ?? "",
          text: card?.council_text ?? "",
        },
      };
    }),
  };
}
