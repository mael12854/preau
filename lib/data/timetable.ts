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
  | { teacherId: string }
  /** EDT général du compte : toutes ses fiches (prof, élève, enfants suivis), toutes écoles. */
  | { all: true };

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
  // Enseignant : EDT général, cours de toutes ses fiches d'enseignant (un compte, plusieurs établissements).
  if ("all" in scope) {
    const { data } = await supabase.rpc("my_all_lessons", { p_from: from, p_to: to });
    const rows = (data ?? []).filter((l) => isoDay(l.starts_at) >= monday && isoDay(l.starts_at) <= sunday);
    // Un même cours vu à deux titres (ex. élève et responsable) n'apparaît qu'une fois.
    const seen = new Set<string>();
    const lessons: LessonView[] = rows
      .filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)))
      .map((l) => ({
        id: l.id,
        subject: { id: l.subject_id, name: l.subject_name, hue: l.subject_hue },
        room: l.room,
        teacher: l.teacher_name,
        className: [l.role === "prof" ? "Cours donné" : (l.who ?? "Élève"), l.class_name, l.school_name].join(" · "),
        start: hoursOf(l.starts_at),
        end: hoursOf(l.ends_at),
        day: (paris(l.starts_at).weekday + 6) % 7,
        cancelled: l.cancelled,
        now: new Date(l.starts_at) <= reference && reference < new Date(l.ends_at),
        seriesId: l.series_id,
        teacherId: l.teacher_id,
        groupId: l.group_id,
        group: l.group_name,
      }));
    return finish(lessons);
  }
  if ("teacherId" in scope) {
    const { data } = await supabase.rpc("my_teaching_lessons", { p_from: from, p_to: to });
    const rows = (data ?? []).filter(
      (l) => isoDay(l.starts_at) >= monday && isoDay(l.starts_at) <= sunday,
    );
    const schools = new Set(rows.map((l) => l.school_name));
    const lessons: LessonView[] = rows.map((l) => ({
      id: l.id,
      subject: { id: l.subject_id, name: l.subject_name, hue: l.subject_hue },
      room: l.room,
      teacher: l.teacher_name,
      className: schools.size > 1 ? `${l.class_name} · ${l.school_name}` : l.class_name,
      start: hoursOf(l.starts_at),
      end: hoursOf(l.ends_at),
      day: (paris(l.starts_at).weekday + 6) % 7,
      cancelled: l.cancelled,
      now: new Date(l.starts_at) <= reference && reference < new Date(l.ends_at),
      seriesId: l.series_id,
      teacherId: l.teacher_id,
      groupId: l.group_id,
      group: l.group_name,
    }));
    return finish(lessons);
  }

  let q = supabase
    .from("lessons")
    .select(
      "id, room, starts_at, ends_at, cancelled, series_id, teacher_id, group_id, subjects(id, name, hue), profiles!lessons_teacher_id_fkey(display_name), classes!inner(name), class_groups(name)",
    )
    .eq("classes.hidden", false)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at");
  q = q.in("class_id", ([] as string[]).concat(scope.classId));
  const studentId = scope.studentId;
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
  return finish(lessons);

  function finish(lessons: LessonView[]) {
    const days = Array.from({ length: 7 }, (_, i) => formatDateShort(addDays(monday, i)));
    const today = isoDay(reference);
    const todayIndex = today >= monday && today <= sunday ? (paris(reference).weekday + 6) % 7 : -1;
    return { days, todayIndex, lessons, monday };
  }
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
