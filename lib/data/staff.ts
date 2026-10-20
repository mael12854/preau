/** Tableaux de bord du personnel (vie scolaire, direction, secrétariat), calculés depuis la base. */
import {
  addDays,
  formatCents,
  formatDateShort,
  formatTimeGrid,
  isoDay,
} from "@/lib/format";
import type { IconName } from "@/lib/icons";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { Tone } from "@/lib/tone";

export type Kpi = { value: string; label: string; tone?: "danger" | "warn" };
export type StaffRow = {
  time: string;
  title: string;
  sub: string;
  tone: Tone;
  status: string;
  action?: string;
  href?: string;
};
export type StaffTodo = { icon: IconName; title: string; sub: string };
export type StaffDashboard = {
  kpis: Kpi[];
  listTitle: string;
  list: StaffRow[];
  empty: string;
  todo: StaffTodo[];
};

const KIND_LABEL: Record<string, string> = {
  absence: "Absence",
  retard: "Retard",
  oubli: "Oubli",
  sanction: "Sanction",
  encouragement: "Encouragement",
};

/** « 2026-11-30 » → « 30/11 ». */
const ddmm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

function dayRange(reference: Date) {
  const day = isoDay(reference);
  // Marge de 3 h pour couvrir le décalage de Paris, puis filtrage exact sur le jour.
  return {
    day,
    from: new Date(
      new Date(`${day}T00:00:00Z`).getTime() - 3 * 3600_000,
    ).toISOString(),
    to: `${addDays(day, 1)}T00:00:00Z`,
  };
}

async function upcomingEvents(
  supabase: SupabaseServer,
  reference: Date,
  days: number,
): Promise<StaffTodo[]> {
  const day = isoDay(reference);
  const { data } = await supabase
    .from("agenda_events")
    .select("title, starts_on")
    .gte("starts_on", day)
    .lte("starts_on", addDays(day, days))
    .eq("is_holiday", false)
    .order("starts_on")
    .limit(3);
  return (data ?? []).map((e) => ({
    icon: "event" as const,
    title: e.title,
    sub: formatDateShort(e.starts_on),
  }));
}

async function cpe(
  supabase: SupabaseServer,
  reference: Date,
): Promise<StaffDashboard> {
  const { day, from, to } = dayRange(reference);
  const [
    { count: toJustify },
    { data: late },
    { data: lessons },
    { data: received },
  ] = await Promise.all([
    supabase
      .from("life_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "a_justifier"),
    supabase
      .from("life_events")
      .select("occurred_at")
      .eq("kind", "retard")
      .gte("occurred_at", from)
      .lt("occurred_at", to),
    supabase
      .from("lessons")
      .select(
        "id, starts_at, cancelled, attendance_validated_at, classes!inner(name), profiles!lessons_teacher_id_fkey(display_name)",
      )
      .eq("classes.hidden", false)
      .gte("starts_at", from)
      .lt("starts_at", to)
      .order("starts_at"),
    supabase
      .from("life_events")
      .select("kind, occurred_at, students(profiles!students_profile_id_fkey(display_name))")
      .eq("status", "justificatif_envoye")
      .order("occurred_at")
      .limit(5),
  ]);
  const today = (lessons ?? []).filter(
    (l) => isoDay(l.starts_at) === day && !l.cancelled,
  );
  const started = today.filter((l) => new Date(l.starts_at) <= reference);
  const missing = started.filter((l) => !l.attendance_validated_at);
  return {
    kpis: [
      {
        value: String(toJustify ?? 0),
        label: "Absences et retards à justifier",
        tone: toJustify ? "danger" : undefined,
      },
      {
        value: String(
          (late ?? []).filter((e) => isoDay(e.occurred_at) === day).length,
        ),
        label: "Retards aujourd'hui",
        tone: "warn",
      },
      { value: String(missing.length), label: "Appels non faits" },
    ],
    listTitle: "Appels du jour",
    empty: "Aucun cours aujourd'hui.",
    list: today.map((l) => {
      const base = {
        time: formatTimeGrid(l.starts_at),
        title: `${l.classes?.name ?? ""} · ${l.profiles?.display_name ?? ""}`,
        sub: "",
      };
      if (l.attendance_validated_at)
        return { ...base, tone: "ok" as const, status: "Fait" };
      if (new Date(l.starts_at) <= reference)
        return { ...base, tone: "danger" as const, status: "Non fait" };
      return { ...base, tone: "neutral" as const, status: "À venir" };
    }),
    todo: [
      ...(received ?? []).map((e) => ({
        icon: "description" as const,
        title: `Justificatif à valider · ${e.students?.profiles?.display_name ?? ""}`,
        sub: `${KIND_LABEL[e.kind] ?? e.kind} du ${formatDateShort(e.occurred_at)}`,
      })),
      ...(await upcomingEvents(supabase, reference, 7)),
    ],
  };
}

async function direction(
  supabase: SupabaseServer,
  reference: Date,
): Promise<StaffDashboard> {
  const day = isoDay(reference);
  const [
    { count: students },
    { count: classes },
    { count: sanctions },
    { data: events },
    { count: toJustify },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("profile_id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("hidden", false),
    supabase
      .from("life_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", "sanction")
      .gte("occurred_at", `${addDays(day, -30)}T00:00:00Z`),
    supabase
      .from("agenda_events")
      .select("title, starts_on, ends_on, tone")
      .gte("starts_on", day)
      .order("starts_on")
      .limit(6),
    supabase
      .from("life_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "a_justifier"),
  ]);
  return {
    kpis: [
      { value: String(students ?? 0), label: "Élèves inscrits" },
      { value: String(classes ?? 0), label: "Classes" },
      {
        value: String(sanctions ?? 0),
        label: "Sanctions · 30 derniers jours",
        tone: sanctions ? "danger" : undefined,
      },
    ],
    listTitle: "Prochains événements",
    empty: "Aucun événement prévu à l'agenda.",
    list: (events ?? []).map((e) => ({
      time: ddmm(e.starts_on),
      title: e.title,
      sub:
        e.ends_on && e.ends_on !== e.starts_on
          ? `Jusqu'au ${formatDateShort(e.ends_on)}`
          : formatDateShort(e.starts_on),
      tone: (e.tone ?? "neutral") as Tone,
      status: "Prévu",
    })),
    todo: toJustify
      ? [
          {
            icon: "event_busy",
            title: `${toJustify} absence${toJustify > 1 ? "s" : ""} ou retard${toJustify > 1 ? "s" : ""} à justifier`,
            sub: "Suivi par la vie scolaire",
          },
        ]
      : [],
  };
}

async function secretariat(
  supabase: SupabaseServer,
  reference: Date,
): Promise<StaffDashboard> {
  const [{ data: unpaid }, { count: pending }, { count: documents }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select(
          "id, label, amount_cents, due_on, created_at, students(profiles!students_profile_id_fkey(display_name))",
        )
        .eq("status", "a_payer")
        .order("due_on", { nullsFirst: false }),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "en_attente"),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("requires_signature", true),
    ]);
  const today = isoDay(reference);
  const total = (unpaid ?? []).reduce((s, i) => s + i.amount_cents, 0);
  const late = (unpaid ?? []).filter((i) => i.due_on && i.due_on < today);
  return {
    kpis: [
      {
        value: String(unpaid?.length ?? 0),
        label: "Factures à payer",
        tone: unpaid?.length ? "danger" : undefined,
      },
      {
        value: String(pending ?? 0),
        label: "Paiements en attente",
        tone: pending ? "warn" : undefined,
      },
      { value: String(documents ?? 0), label: "Documents à signer diffusés" },
    ],
    listTitle: "Factures à payer",
    empty: "Aucune facture en attente de paiement.",
    list: (unpaid ?? []).slice(0, 6).map((i) => ({
      time: i.due_on ? ddmm(i.due_on) : "—",
      title: i.label,
      sub: `${i.students?.profiles?.display_name ?? ""} · ${formatCents(i.amount_cents)}`,
      tone:
        i.due_on && i.due_on < today
          ? ("danger" as const)
          : ("neutral" as const),
      status: i.due_on && i.due_on < today ? "En retard" : "À payer",
    })),
    todo: late.length
      ? [
          {
            icon: "payments",
            title: `Relancer ${late.length} facture${late.length > 1 ? "s" : ""} en retard`,
            sub: `Total à payer ${formatCents(total)}`,
          },
        ]
      : [],
  };
}

export async function getStaffDashboard(
  supabase: SupabaseServer,
  kind: "cpe" | "direction" | "secretariat",
  reference: Date,
) {
  return kind === "cpe"
    ? cpe(supabase, reference)
    : kind === "direction"
      ? direction(supabase, reference)
      : secretariat(supabase, reference);
}
