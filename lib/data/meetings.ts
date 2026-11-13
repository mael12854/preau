import "server-only";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { getPublishTargets } from "./targets";

export type MeetingSummary = { id: string; title: string; day: string; starts: string; ends: string; open: boolean; classes: string[] };

/** Réunions parents-profs visibles (personnel de l'école, familles des classes concernées). */
export async function getMeetings(supabase: SupabaseServer, viewer: Viewer) {
  const [{ data }, targets] = await Promise.all([
    supabase
      .from("parent_meetings")
      .select("id, title, day, starts, ends, open, parent_meeting_classes(classes(name))")
      .order("day", { ascending: false }),
    viewer.staff ? getPublishTargets(supabase, viewer) : Promise.resolve(null),
  ]);
  const meetings: MeetingSummary[] = (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    day: m.day,
    starts: m.starts.slice(0, 5),
    ends: m.ends.slice(0, 5),
    open: m.open,
    classes: m.parent_meeting_classes.map((x) => x.classes?.name ?? "").filter(Boolean).sort(),
  }));
  return { meetings, canCreate: viewer.staff && !!targets?.classes.length, classes: targets?.classes ?? [] };
}

/** Bilan d'un rendez-vous : texte du professeur et note sur 20 par matière. */
export type MeetingReport = {
  summary: string;
  written_at: string;
  scores: { subject_id: string; name: string; score: number }[];
};

type Slot = { id: string; starts_at: string; ends_at: string; place: string | null; visio_url: string | null };
export type MeetingBoard = {
  meeting: {
    id: string;
    title: string;
    day: string;
    starts: string;
    ends: string;
    slot_minutes: number;
    cancel_hours: number;
    open: boolean;
    mine: boolean;
    classes: string[] | null;
  };
  my_slots: (Slot & {
    booking: {
      id: string;
      student: string;
      parent: string;
      /** Le rendez-vous a commencé : le bilan peut être rédigé. */
      can_report: boolean;
      /** Matières que le professeur enseigne à l'élève (une note sur 20 chacune). */
      subjects: { id: string; name: string }[];
      report: MeetingReport | null;
    } | null;
  })[];
  children: {
    student_id: string;
    name: string;
    teachers: { teacher_id: string; name: string; slots: (Slot & { state: "free" | "taken" | "mine" })[] }[];
  }[];
  my_bookings: (Slot & { id: string; teacher: string; student: string; can_cancel: boolean; report: MeetingReport | null })[];
};

export async function getMeetingBoard(supabase: SupabaseServer, id: string): Promise<MeetingBoard | null> {
  const { data, error } = await supabase.rpc("meeting_board", { p_meeting: id });
  if (error || !data) return null;
  return data as unknown as MeetingBoard;
}
