import "server-only";
import { formatDayMonth, formatDueDay, isoDay } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { HomeworkDayView, HomeworkView } from "./types";

type Scope = { classId: string } | { teacherId: string };

/** Devoirs à venir (échéance après aujourd'hui), groupés par jour d'échéance. */
export async function getUpcomingHomework(supabase: SupabaseServer, scope: Scope, reference: Date) {
  const today = isoDay(reference);
  let q = supabase
    .from("homework")
    .select("id, content, given_on, due_on, is_exam, attachment_name, subjects(id, name, hue), classes(name)")
    .gt("due_on", today)
    .order("due_on")
    .order("id");
  q = "classId" in scope ? q.eq("class_id", scope.classId) : q.eq("teacher_id", scope.teacherId);
  const { data } = await q;

  const items: HomeworkView[] = (data ?? []).map((h) => ({
    id: h.id,
    subject: { id: h.subjects!.id, name: h.subjects!.name, hue: h.subjects!.hue },
    text: h.content,
    given: formatDayMonth(h.given_on),
    dueOn: h.due_on,
    exam: h.is_exam,
    file: h.attachment_name,
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
export async function getDoneHomework(supabase: SupabaseServer, userId: string): Promise<string[]> {
  const { data } = await supabase.from("homework_done").select("homework_id").eq("user_id", userId);
  return (data ?? []).map((d) => d.homework_id);
}
