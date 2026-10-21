import "server-only";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { classStudents } from "./common";
import { getPublishTargets } from "./targets";

/** Classes où la personne mène les activités (professeur de la classe, administration). */
export async function teachingClasses(supabase: SupabaseServer, viewer: Viewer) {
  if (!viewer.staff) return [];
  return (await getPublishTargets(supabase, viewer))?.classes ?? [];
}

/** Classes suivies par un élève (ou les enfants d'un responsable). */
export function followedClassIds(viewer: Viewer) {
  const list = viewer.student ? [viewer.student, ...viewer.children] : viewer.children;
  return [...new Set(list.flatMap((s) => s.classIds))];
}

// ===== Tirage au sort et groupes =====
export type DrawClass = {
  id: string;
  name: string;
  students: { id: string; name: string }[];
  groups: { id: string; name: string; members: string[] }[];
};

export async function getDrawClasses(supabase: SupabaseServer, viewer: Viewer): Promise<DrawClass[]> {
  const classes = await teachingClasses(supabase, viewer);
  if (!classes.length) return [];
  const [rosters, { data: groups }] = await Promise.all([
    Promise.all(classes.map((c) => classStudents(supabase, c.id))),
    supabase
      .from("class_groups")
      .select("id, name, class_id, student_class_groups(student_id)")
      .in(
        "class_id",
        classes.map((c) => c.id),
      )
      .order("name"),
  ]);
  return classes
    .map((c, i) => ({
      id: c.id,
      name: c.name,
      students: rosters[i].map((s) => ({ id: s.id, name: s.name })),
      groups: (groups ?? [])
        .filter((g) => g.class_id === c.id)
        .map((g) => ({ id: g.id, name: g.name, members: g.student_class_groups.map((m) => m.student_id) }))
        .filter((g) => g.members.length > 0),
    }))
    .filter((c) => c.students.length > 0);
}

// ===== Quiz =====
export type QuizQuestion = { prompt: string; choices: string[]; correct: number; seconds: number };
export type QuizSummary = { id: string; title: string; questions: QuizQuestion[] };
export type LiveSession = { id: string; title: string; className: string; status: string };

export async function getMyQuizzes(supabase: SupabaseServer, viewer: Viewer): Promise<QuizSummary[]> {
  const { data } = await supabase
    .from("quizzes")
    .select("id, title, updated_at, quiz_questions(position, prompt, choices, correct, seconds, removed)")
    .eq("owner_id", viewer.profileId)
    .eq("removed", false)
    .order("updated_at", { ascending: false });
  return (data ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    questions: q.quiz_questions
      .filter((x) => !x.removed)
      .sort((a, b) => a.position - b.position)
      .map((x) => ({ prompt: x.prompt, choices: x.choices, correct: x.correct, seconds: x.seconds })),
  }));
}

/** Parties en cours : celles de ses classes pour un élève, celles qu'on anime pour un professeur. */
export async function getLiveSessions(supabase: SupabaseServer, viewer: Viewer): Promise<LiveSession[]> {
  let q = supabase
    .from("quiz_sessions")
    .select("id, status, created_at, classes(name), quizzes(title)")
    .neq("status", "ended")
    .gte("created_at", new Date(Date.now() - 6 * 3600_000).toISOString())
    .order("created_at", { ascending: false });
  q = viewer.staff ? q.eq("host_id", viewer.profileId) : q.in("class_id", followedClassIds(viewer));
  const { data } = await q;
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.quizzes?.title ?? "Quiz",
    className: s.classes?.name ?? "",
    status: s.status,
  }));
}

// ===== Cartes de vocabulaire =====
export type VocabCard = { id: string; front: string; back: string; box: number; due: string | null };
export type VocabDeck = {
  id: string;
  title: string;
  classId: string;
  className: string;
  mine: boolean;
  cards: VocabCard[];
};

export async function getVocabDecks(supabase: SupabaseServer, viewer: Viewer): Promise<VocabDeck[]> {
  const staffClasses = await teachingClasses(supabase, viewer);
  const ids = viewer.staff ? staffClasses.map((c) => c.id) : followedClassIds(viewer);
  if (!ids.length) return [];
  const [{ data: decks }, { data: progress }] = await Promise.all([
    supabase
      .from("vocab_decks")
      .select("id, title, class_id, owner_id, updated_at, classes(name), vocab_cards(id, front, back, position, removed)")
      .in("class_id", ids)
      .eq("removed", false)
      .order("updated_at", { ascending: false }),
    viewer.student
      ? supabase.from("vocab_progress").select("card_id, box, due").eq("student_id", viewer.profileId)
      : Promise.resolve({ data: [] as { card_id: string; box: number; due: string }[] }),
  ]);
  const byCard = new Map((progress ?? []).map((p) => [p.card_id, p]));
  return (decks ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    classId: d.class_id,
    className: d.classes?.name ?? "",
    mine: d.owner_id === viewer.profileId,
    cards: d.vocab_cards
      .filter((c) => !c.removed)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        box: byCard.get(c.id)?.box ?? 0,
        due: byCard.get(c.id)?.due ?? null,
      })),
  }));
}
