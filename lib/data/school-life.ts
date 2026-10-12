import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { formatDateShort, formatTimeText } from "@/lib/format";
import type { IconName } from "@/lib/icons";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { Tone } from "@/lib/tone";
import type { LifeEventView, LifeStatsView } from "./types";

type Kind = Database["public"]["Enums"]["life_event_kind"];
type Status = Database["public"]["Enums"]["life_event_status"];

const KIND: Record<Kind, { type: string; icon: IconName; tone: Tone }> = {
  absence: { type: "Absence", icon: "event_busy", tone: "danger" },
  retard: { type: "Retard", icon: "schedule", tone: "warn" },
  oubli: { type: "Oubli de matériel", icon: "backpack", tone: "neutral" },
  sanction: { type: "Sanction", icon: "gavel", tone: "danger" },
  encouragement: { type: "Encouragement", icon: "thumb_up", tone: "ok" },
};

function status(kind: Kind, s: Status): { label: string; tone: Tone } {
  if (s === "a_justifier") return { label: "À justifier", tone: "danger" };
  if (s === "justificatif_envoye") return { label: "Justificatif envoyé", tone: "info" };
  if (s === "justifie") return { label: "Justifié", tone: "ok" };
  return kind === "encouragement" ? { label: "Encouragement", tone: "ok" } : { label: "Noté", tone: "neutral" };
}

/** Événements de vie scolaire : d'un élève, ou de tout l'établissement pour la vie scolaire. */
export async function getLifeEvents(supabase: SupabaseServer, studentId: string | null, canJustify: boolean) {
  let q = supabase
    .from("life_events")
    .select("id, kind, occurred_at, whole_day, detail, status, minutes, students(profiles(display_name))")
    .order("occurred_at", { ascending: false });
  if (studentId) q = q.eq("student_id", studentId);
  const { data } = await q;
  const rows = data ?? [];

  const events: LifeEventView[] = rows.map((e) => {
    const k = KIND[e.kind];
    const st = status(e.kind, e.status);
    const when = e.whole_day ? "journée" : e.kind === "retard" ? formatTimeText(e.occurred_at) : null;
    return {
      id: e.id,
      icon: k.icon,
      type: k.type,
      date: [formatDateShort(e.occurred_at), when].filter(Boolean).join(" · "),
      detail: e.detail,
      tone: k.tone,
      status: st.label,
      statusTone: st.tone,
      canJustify: canJustify && e.status === "a_justifier",
      student: studentId ? undefined : e.students?.profiles?.display_name,
    };
  });
  const stats: LifeStatsView = {
    absences: rows.filter((e) => e.kind === "absence").length,
    toJustify: rows.filter((e) => e.status === "a_justifier").length,
    lates: rows.filter((e) => e.kind === "retard").length,
    lateMinutes: rows.filter((e) => e.kind === "retard").reduce((n, e) => n + (e.minutes ?? 0), 0),
    sanctions: rows.filter((e) => e.kind === "sanction").length,
    encouragements: rows.filter((e) => e.kind === "encouragement").length,
  };
  const firstToJustify = rows.find((e) => e.status === "a_justifier");
  return { events, stats, firstToJustify };
}
