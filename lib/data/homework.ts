import "server-only";
import { formatDayMonth, formatDueDay, isoDay } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { AttachmentView, HomeworkDayView, HomeworkView, LessonNoteView } from "./types";

/** Pièces jointes envoyées (la RLS ne renvoie que celles que la personne peut voir). */
async function attachmentsOf(supabase: SupabaseServer, column: "homework_id" | "lesson_id", ids: string[]) {
  const map = new Map<string, AttachmentView[]>();
  if (!ids.length) return map;
  const { data } = await supabase
    .from("class_attachments")
    .select("id, name, size_bytes, homework_id, lesson_id, uploaded_at")
    .in(column, ids)
    .not("uploaded_at", "is", null)
    .order("created_at");
  for (const a of data ?? []) {
    const key = (column === "homework_id" ? a.homework_id : a.lesson_id) ?? "";
    map.set(key, [...(map.get(key) ?? []), { id: a.id, name: a.name, size: a.size_bytes }]);
  }
  return map;
}

/** Classe : une ou plusieurs (classe principale et classes supplémentaires de l'élève). */
type Scope = { classId: string | string[] } | { teacherId: string };

/** Devoirs à venir (échéance après aujourd'hui), groupés par jour d'échéance. */
export async function getUpcomingHomework(
  supabase: SupabaseServer,
  scope: Scope,
  reference: Date,
) {
  const today = isoDay(reference);
  let q = supabase
    .from("homework")
    .select(
      "id, content, given_on, due_on, is_exam, attachment_name, subjects(id, name, hue), classes(name)",
    )
    .gt("due_on", today)
    .order("due_on")
    .order("id");
  q =
    "classId" in scope
      ? q.in("class_id", ([] as string[]).concat(scope.classId))
      : q.eq("teacher_id", scope.teacherId);
  const { data } = await q;
  const files = await attachmentsOf(supabase, "homework_id", (data ?? []).map((h) => h.id));

  const items: HomeworkView[] = (data ?? []).map((h) => ({
    id: h.id,
    subject: {
      id: h.subjects!.id,
      name: h.subjects!.name,
      hue: h.subjects!.hue,
    },
    text: h.content,
    given: formatDayMonth(h.given_on),
    dueOn: h.due_on,
    exam: h.is_exam,
    file: h.attachment_name,
    files: files.get(h.id) ?? [],
    className: h.classes?.name,
  }));
  const days: HomeworkDayView[] = [];
  for (const h of items) {
    const last = days.at(-1);
    if (last?.dueOn === h.dueOn) last.items.push(h);
    else days.push({ day: formatDueDay(h.dueOn), dueOn: h.dueOn, items: [h] });
  }
  return days;
}

/** Devoirs cochés par la personne connectée (coche personnelle). */
export async function getDoneHomework(
  supabase: SupabaseServer,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("homework_done")
    .select("homework_id")
    .eq("user_id", userId);
  return (data ?? []).map((d) => d.homework_id);
}

export type HomeworkChoice = {
  classId: string;
  subjectId: string;
  label: string;
  /** Date (ISO) du prochain cours de cette matière dans la classe, après aujourd'hui. */
  next: string | null;
};

/** Classes et matières où l'enseignant peut donner un devoir, avec la date de son prochain cours. */
export async function getHomeworkChoices(
  supabase: SupabaseServer,
  teacherId: string,
  reference: Date,
): Promise<HomeworkChoice[]> {
  const today = isoDay(reference);
  const [{ data: lessons }, { data: teachings }] = await Promise.all([
    supabase
      .from("lessons")
      .select("class_id, subject_id, starts_at, classes!inner(name), subjects(name)")
      .eq("teacher_id", teacherId)
      .eq("classes.hidden", false)
      .eq("cancelled", false)
      .gte("starts_at", reference.toISOString())
      .order("starts_at")
      .limit(3000),
    supabase
      .from("teachings")
      .select("class_id, subject_id, classes!inner(name), subjects(name)")
      .eq("teacher_id", teacherId)
      .eq("classes.hidden", false),
  ]);
  const map = new Map<string, HomeworkChoice>();
  for (const l of lessons ?? []) {
    const key = `${l.class_id}|${l.subject_id}`;
    const day = isoDay(l.starts_at);
    const c = map.get(key);
    if (!c)
      map.set(key, {
        classId: l.class_id,
        subjectId: l.subject_id,
        label: `${l.classes?.name ?? ""} · ${l.subjects?.name ?? ""}`,
        next: day > today ? day : null,
      });
    else if (!c.next && day > today) c.next = day;
  }
  for (const t of teachings ?? []) {
    const key = `${t.class_id}|${t.subject_id}`;
    if (!map.has(key))
      map.set(key, {
        classId: t.class_id,
        subjectId: t.subject_id,
        label: `${t.classes?.name ?? ""} · ${t.subjects?.name ?? ""}`,
        next: null,
      });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/** Contenus de séance des 30 derniers jours (et à venir), du plus récent au plus ancien. */
export async function getLessonNotes(
  supabase: SupabaseServer,
  scope: Scope,
  reference: Date,
): Promise<LessonNoteView[]> {
  const from = new Date(reference.getTime() - 30 * 86400000).toISOString();
  let q = supabase
    .from("lesson_notes")
    .select("lesson_id, content, starts_at, subjects(id, name, hue), classes(name)")
    .gte("starts_at", from)
    .order("starts_at", { ascending: false })
    .limit(200);
  q =
    "classId" in scope
      ? q.in("class_id", ([] as string[]).concat(scope.classId))
      : q.eq("teacher_id", scope.teacherId);
  const { data } = await q;
  const files = await attachmentsOf(supabase, "lesson_id", (data ?? []).map((n) => n.lesson_id));
  return (data ?? []).map((n) => ({
    lessonId: n.lesson_id,
    subject: n.subjects ? { id: n.subjects.id, name: n.subjects.name, hue: n.subjects.hue } : null,
    className: n.classes?.name ?? "",
    startsAt: n.starts_at,
    content: n.content,
    files: files.get(n.lesson_id) ?? [],
  }));
}

export type NoteLesson = {
  id: string;
  label: string;
  startsAt: string;
  content: string;
  files: AttachmentView[];
};

/** Cours de l'enseignant (3 semaines passées, 1 semaine à venir) pour écrire le contenu de séance. */
export async function getNoteLessons(
  supabase: SupabaseServer,
  teacherId: string,
  reference: Date,
): Promise<NoteLesson[]> {
  const from = new Date(reference.getTime() - 21 * 86400000).toISOString();
  const to = new Date(reference.getTime() + 7 * 86400000).toISOString();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, starts_at, classes!inner(name), subjects(name)")
    .eq("teacher_id", teacherId)
    .eq("cancelled", false)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: false })
    .limit(300);
  const ids = (lessons ?? []).map((l) => l.id);
  const [{ data: notes }, files] = await Promise.all([
    ids.length
      ? supabase.from("lesson_notes").select("lesson_id, content").in("lesson_id", ids)
      : Promise.resolve({ data: [] as { lesson_id: string; content: string }[] }),
    attachmentsOf(supabase, "lesson_id", ids),
  ]);
  const content = new Map((notes ?? []).map((n) => [n.lesson_id, n.content]));
  return (lessons ?? []).map((l) => ({
    id: l.id,
    label: `${l.classes?.name ?? ""} · ${l.subjects?.name ?? ""}`,
    startsAt: l.starts_at,
    content: content.get(l.id) ?? "",
    files: files.get(l.id) ?? [],
  }));
}
