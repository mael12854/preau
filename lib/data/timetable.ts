import "server-only";
import {
  addDays,
  formatDateShort,
  hoursOf,
  isoDay,
  mondayOf,
  paris,
} from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { LessonView } from "./types";

/** Classe : une ou plusieurs (classe principale et classes supplémentaires de l'élève). */
type Scope = { classId: string | string[] } | { teacherId: string };

/**
 * Cours d'une semaine (lundi → dimanche), pour une classe ou un professeur.
 * `weekOf` : un jour de la semaine voulue (par défaut, celle de `reference`).
 */
export async function getWeekLessons(
  supabase: SupabaseServer,
  scope: Scope,
  reference: Date,
  weekOf?: string,
) {
  const monday = mondayOf(weekOf ?? isoDay(reference));
  const sunday = addDays(monday, 6);
  // Fenêtre large en UTC (décalage de Paris), puis filtrage exact sur les jours de la semaine.
  const from = new Date(new Date(`${monday}T00:00:00Z`).getTime() - 3 * 3600_000).toISOString();
  const to = `${addDays(monday, 7)}T03:00:00Z`;
  let q = supabase
    .from("lessons")
    .select(
      "id, room, starts_at, ends_at, cancelled, series_id, teacher_id, subjects(id, name, hue), profiles!lessons_teacher_id_fkey(display_name), classes(name)",
    )
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  q = "classId" in scope ? q.in("class_id", ([] as string[]).concat(scope.classId)) : q.eq("teacher_id", scope.teacherId);
  const { data } = await q;

  const lessons: LessonView[] = (data ?? [])
    .filter((l) => isoDay(l.starts_at) >= monday && isoDay(l.starts_at) <= sunday)
    .map((l) => ({
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
      seriesId: l.series_id,
      teacherId: l.teacher_id,
    }));
  const days = Array.from({ length: 7 }, (_, i) => formatDateShort(addDays(monday, i)));
  const today = isoDay(reference);
  const todayIndex = today >= monday && today <= sunday ? (paris(reference).weekday + 6) % 7 : -1;
  return { days, todayIndex, lessons, monday };
}

/** Cours du jour (tableau de bord). */
export async function getTodayLessons(
  supabase: SupabaseServer,
  scope: Scope,
  reference: Date,
) {
  const week = await getWeekLessons(supabase, scope, reference);
  return week.lessons.filter((l) => l.day === week.todayIndex);
}
