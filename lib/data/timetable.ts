import "server-only";
import { addDays, formatDateShort, hoursOf, isoDay, mondayOf, paris } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { LessonView } from "./types";

type Scope = { classId: string } | { teacherId: string };

/** Cours de la semaine contenant `reference` (lundi → vendredi), pour une classe ou un professeur. */
export async function getWeekLessons(supabase: SupabaseServer, scope: Scope, reference: Date) {
  const monday = mondayOf(isoDay(reference));
  // Fenêtre large en UTC : les cours ont lieu en journée, quel que soit le décalage horaire de Paris.
  const from = new Date(new Date(`${monday}T00:00:00Z`).getTime() - 3 * 3600_000).toISOString();
  const to = `${addDays(monday, 5)}T00:00:00Z`;
  let q = supabase
    .from("lessons")
    .select("id, room, starts_at, ends_at, cancelled, subjects(id, name, hue), profiles!lessons_teacher_id_fkey(display_name), classes(name)")
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  q = "classId" in scope ? q.eq("class_id", scope.classId) : q.eq("teacher_id", scope.teacherId);
  const { data } = await q;

  const lessons: LessonView[] = (data ?? []).map((l) => ({
    id: l.id,
    subject: { id: l.subjects!.id, name: l.subjects!.name, hue: l.subjects!.hue },
    room: l.room,
    teacher: l.profiles?.display_name ?? "",
    className: l.classes?.name,
    start: hoursOf(l.starts_at),
    end: hoursOf(l.ends_at),
    day: (paris(l.starts_at).weekday + 6) % 7,
    cancelled: l.cancelled,
    now: new Date(l.starts_at) <= reference && reference < new Date(l.ends_at),
  }));
  const days = Array.from({ length: 5 }, (_, i) => formatDateShort(addDays(monday, i)));
  const todayIndex = (paris(reference).weekday + 6) % 7;
  return { days, todayIndex: todayIndex < 5 ? todayIndex : -1, lessons };
}

/** Cours du jour (tableau de bord). */
export async function getTodayLessons(supabase: SupabaseServer, scope: Scope, reference: Date) {
  const week = await getWeekLessons(supabase, scope, reference);
  return week.lessons.filter((l) => l.day === week.todayIndex);
}
