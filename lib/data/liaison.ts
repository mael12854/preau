import "server-only";
import { formatRelative } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";

export type LiaisonNoteView = {
  id: string;
  title: string;
  body: string;
  author: string;
  date: string;
  className: string;
  requiresSignature: boolean;
  /** Famille : ce mot est signé pour l'enfant suivi. */
  signed: boolean;
  /** Enseignant : signatures reçues / familles de la classe. */
  signatures?: { signed: number; total: number };
};

/** Mots du cahier de liaison d'une classe (famille) ou de toutes les classes de l'enseignant. */
export async function getLiaisonNotes(
  supabase: SupabaseServer,
  scope: { classId: string; studentId: string } | { authorId: string },
  reference: Date,
): Promise<LiaisonNoteView[]> {
  let q = supabase
    .from("liaison_notes")
    .select(
      "id, title, body, requires_signature, created_at, class_id, classes(name), profiles!liaison_notes_author_id_fkey(display_name), liaison_signatures(student_id)",
    )
    .order("created_at", { ascending: false });
  q =
    "classId" in scope
      ? q.eq("class_id", scope.classId)
      : q.eq("author_id", scope.authorId);
  const { data } = await q;
  const notes = data ?? [];

  // Enseignant : nombre d'élèves par classe, pour le suivi des signatures.
  const sizes = new Map<string, number>();
  if (!("classId" in scope)) {
    const classIds = [...new Set(notes.map((n) => n.class_id))];
    if (classIds.length) {
      const { data: students } = await supabase
        .from("students")
        .select("class_id")
        .in("class_id", classIds);
      (students ?? []).forEach((s) =>
        sizes.set(s.class_id, (sizes.get(s.class_id) ?? 0) + 1),
      );
    }
  }

  return notes.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    author: n.profiles?.display_name ?? "",
    date: formatRelative(n.created_at, reference),
    className: n.classes?.name ?? "",
    requiresSignature: n.requires_signature,
    signed:
      "classId" in scope
        ? n.liaison_signatures.some((s) => s.student_id === scope.studentId)
        : false,
    signatures:
      "classId" in scope
        ? undefined
        : {
            signed: n.liaison_signatures.length,
            total: sizes.get(n.class_id) ?? 0,
          },
  }));
}

/** Classes de l'enseignant (pour écrire un mot). */
export async function getTeacherClasses(
  supabase: SupabaseServer,
  teacherId: string,
) {
  const { data } = await supabase
    .from("teachings")
    .select("class_id, classes(name)")
    .eq("teacher_id", teacherId);
  const seen = new Map<string, string>();
  (data ?? []).forEach((t) => seen.set(t.class_id, t.classes?.name ?? ""));
  return [...seen]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
