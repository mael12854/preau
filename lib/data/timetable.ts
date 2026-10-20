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

/**
 * Classe : une ou plusieurs (classe principale et classes supplémentaires de l'élève).
 * `studentId` : EDT nominatif, cours de la classe entière et des groupes de l'élève seulement.
 */
type Scope =
  | { classId: string | string[]; studentId?: string }
  | { teacherId: string };

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
      "id, room, starts_at, ends_at, cancelled, series_id, teacher_id, group_id, subjects(id, name, hue), profiles!lessons_teacher_id_fkey(display_name), classes!inner(name), class_groups(name)",
    )
    .eq("classes.hidden", false)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  q = "classId" in scope ? q.in("class_id", ([] as string[]).concat(scope.classId)) : q.eq("teacher_id", scope.teacherId);
  const studentId = "classId" in scope ? scope.studentId : undefined;
  const [{ data }, groups] = await Promise.all([
    q,
    studentId
      ? supabase
          .from("student_class_groups")
          .select("group_id")
          .eq("student_id", studentId)
          .then((r) => new Set((r.data ?? []).map((g) => g.group_id)))
      : null,
  ]);

  const lessons: LessonView[] = (data ?? [])
    .filter((l) => isoDay(l.starts_at) >= monday && isoDay(l.starts_at) <= sunday)
    .filter((l) => !groups || !l.group_id || groups.has(l.group_id))
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
      groupId: l.group_id,
      group: l.class_groups?.name ?? null,
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
