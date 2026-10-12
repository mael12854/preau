import "server-only";
import { formatCents, formatDayMonth, formatSize, isoDay } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { Tone } from "@/lib/tone";
import { iconName } from "./common";
import type { AgendaEventView, BillView, DocumentView, PendingTopUpView, ReportPeriodView } from "./types";

const CATEGORY = { administratif: "Administratif", pedagogique: "Pédagogique", cantine: "Cantine" } as const;

export async function getDocuments(supabase: SupabaseServer, profileId: string): Promise<DocumentView[]> {
  const [{ data }, { data: signed }] = await Promise.all([
    supabase.from("documents").select("id, title, category, icon, size_bytes, requires_signature, created_at").order("created_at", { ascending: false }),
    supabase.from("document_signatures").select("document_id").eq("profile_id", profileId),
  ]);
  const signedIds = new Set((signed ?? []).map((s) => s.document_id));
  return (data ?? []).map((d) => ({
    id: d.id,
    icon: iconName(d.icon),
    name: d.title,
    category: CATEGORY[d.category],
    date: formatDayMonth(d.created_at),
    size: formatSize(d.size_bytes),
    toSign: d.requires_signature && !signedIds.has(d.id),
    signed: d.requires_signature && signedIds.has(d.id),
  }));
}

export async function getAgenda(supabase: SupabaseServer, year: number, month: number): Promise<AgendaEventView[]> {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const next = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, "0")}-01`;
  const { data } = await supabase
    .from("agenda_events")
    .select("title, tone, starts_on, ends_on, is_holiday")
    .lt("starts_on", next)
    .or(`starts_on.gte.${first},ends_on.gte.${first}`)
    .order("starts_on");
  return (data ?? []).map((e) => ({ title: e.title, tone: e.tone, startsOn: e.starts_on, endsOn: e.ends_on, holiday: e.is_holiday }));
}

/** Solde, menu du jour et factures d'un élève (famille), ou de tout l'établissement (secrétariat). */
export async function getPayments(supabase: SupabaseServer, studentId: string | null, reference: Date) {
  const today = isoDay(reference);
  let invoices = supabase
    .from("invoices")
    .select("id, label, amount_cents, status, due_on, paid_on, method, created_at, students(profiles(display_name))")
    .order("created_at", { ascending: false });
  if (studentId) invoices = invoices.eq("student_id", studentId);
  let payments = supabase.from("payments").select("id, kind, invoice_id, amount_cents, created_at").eq("status", "en_attente");
  if (studentId) payments = payments.eq("student_id", studentId);
  const [{ data: bills }, account, { data: menu }, { data: pending }] = await Promise.all([
    invoices,
    studentId
      ? supabase.from("canteen_accounts").select("balance_cents, meal_price_cents").eq("student_id", studentId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("menus").select("items").eq("served_on", today).maybeSingle(),
    payments,
  ]);
  const pendingByInvoice = new Map((pending ?? []).filter((p) => p.invoice_id).map((p) => [p.invoice_id!, p.id]));

  const view: BillView[] = (bills ?? []).map((b) => {
    const s: { status: string; tone: Tone; date: string } =
      b.status === "a_payer"
        ? { status: "À payer", tone: "danger", date: b.due_on ? `à régler avant le ${formatDayMonth(b.due_on)}` : "à régler" }
        : b.status === "creditee"
          ? { status: "Crédité", tone: "info", date: [b.paid_on && formatDayMonth(b.paid_on), b.method].filter(Boolean).join(" · ") }
          : { status: "Payée", tone: "ok", date: b.paid_on ? `payée le ${formatDayMonth(b.paid_on)}` : "payée" };
    const pendingPaymentId = b.status === "a_payer" ? pendingByInvoice.get(b.id) : undefined;
    return {
      id: b.id, label: b.label, amount: formatCents(b.amount_cents), ...s,
      payable: b.status === "a_payer" && !pendingPaymentId,
      ...(pendingPaymentId ? { status: "Paiement en cours", tone: "info" as const, pendingPaymentId } : {}),
      student: studentId ? undefined : b.students?.profiles?.display_name,
    };
  });
  const a = account.data;
  const pendingTopUps: PendingTopUpView[] = (pending ?? [])
    .filter((p) => p.kind === "recharge_cantine")
    .map((p) => ({ id: p.id, amount: formatCents(p.amount_cents), date: formatDayMonth(p.created_at) }));
  return {
    bills: view,
    pendingTopUps,
    balance: a ? { cents: a.balance_cents, meals: Math.floor(a.balance_cents / a.meal_price_cents) } : null,
    menu: menu?.items ?? null,
  };
}

const TERM = ["1er", "2e", "3e"];

/** Bulletins : périodes visibles, contenu seulement après publication (RLS). */
export async function getReportCards(supabase: SupabaseServer, reference: Date): Promise<ReportPeriodView[]> {
  const today = isoDay(reference);
  const { data } = await supabase
    .from("report_cards")
    .select("id, school_year, term, class_name, head_teacher, publish_on, council_mention, council_text, students(profiles(display_name)), report_card_lines(level, comment, position, subjects(id, name, hue))")
    .order("publish_on", { ascending: false });
  return (data ?? []).map((rc) => {
    const available = rc.publish_on <= today;
    return {
      id: rc.id,
      title: `Trimestre ${rc.term} · ${rc.school_year}`,
      detail: available ? `${rc.class_name} · publié le ${formatDayMonth(rc.publish_on)}` : `Publication le ${formatDayMonth(rc.publish_on)}`,
      available,
      reportTitle: `Bulletin du ${TERM[rc.term - 1]} trimestre`,
      student: rc.students?.profiles?.display_name ?? "",
      className: rc.class_name,
      headTeacher: rc.head_teacher,
      lines: [...rc.report_card_lines]
        .sort((x, y) => x.position - y.position)
        .filter((l) => l.level !== "NE" && l.level !== "ABS" && l.level !== "DISP")
        .map((l) => ({ subject: { id: l.subjects!.id, name: l.subjects!.name, hue: l.subjects!.hue }, level: l.level as "MI" | "MF" | "MS" | "TB", comment: l.comment })),
      council: rc.council_mention ? { title: rc.council_mention, text: rc.council_text ?? "" } : null,
    };
  });
}
