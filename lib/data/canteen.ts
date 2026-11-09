import "server-only";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { addDays, mondayOf } from "@/lib/format";
import { classStudents } from "./common";
import { getPublishTargets } from "./targets";

export type CanteenAdmin = {
  enabled: boolean;
  mealPriceCents: number;
  monday: string;
  /** Jours de la semaine affichée (lundi → dimanche) et menu de chacun (plats, vide si aucun). */
  days: { day: string; items: string[] }[];
  students: { id: string; name: string; className: string; balanceCents: number | null }[];
  invoices: {
    id: string;
    studentId: string;
    student: string;
    label: string;
    amountCents: number;
    status: "a_payer" | "payee" | "creditee";
    dueOn: string | null;
    paidOn: string | null;
    method: string | null;
  }[];
  classes: { id: string; name: string; studentIds: string[] }[];
};

/** Gestion de la cantine (secrétariat, direction) : réglages, menus de la semaine, soldes, factures. */
export async function getCanteenAdmin(supabase: SupabaseServer, viewer: Viewer, weekOf: string): Promise<CanteenAdmin> {
  const monday = mondayOf(weekOf);
  const classes = (await getPublishTargets(supabase, viewer))?.classes ?? [];
  const rosters = await Promise.all(classes.map((c) => classStudents(supabase, c.id)));
  const byId = new Map<string, { id: string; name: string; className: string }>();
  classes.forEach((c, i) =>
    rosters[i].forEach((s) => {
      if (!byId.has(s.id)) byId.set(s.id, { id: s.id, name: s.name, className: c.name });
    }),
  );
  const ids = [...byId.keys()];
  const [{ data: school }, { data: menus }, { data: accounts }, { data: invoices }] = await Promise.all([
    supabase.from("schools").select("canteen, meal_price_cents").eq("domain", viewer.school.domain).maybeSingle(),
    supabase.from("menus").select("served_on, items").gte("served_on", monday).lte("served_on", addDays(monday, 6)),
    ids.length
      ? supabase.from("canteen_accounts").select("student_id, balance_cents").in("student_id", ids)
      : Promise.resolve({ data: [] as { student_id: string; balance_cents: number }[] }),
    ids.length
      ? supabase
          .from("invoices")
          .select("id, student_id, label, amount_cents, status, due_on, paid_on, method, created_at")
          .in("student_id", ids)
          .order("created_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [] }),
  ]);
  const balances = new Map((accounts ?? []).map((a) => [a.student_id, a.balance_cents]));
  return {
    enabled: school?.canteen ?? false,
    mealPriceCents: school?.meal_price_cents ?? 450,
    monday,
    days: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      return { day, items: menus?.find((m) => m.served_on === day)?.items ?? [] };
    }),
    students: [...byId.values()]
      .map((s) => ({ ...s, balanceCents: balances.get(s.id) ?? null }))
      .sort((a, b) => a.className.localeCompare(b.className, "fr") || a.name.localeCompare(b.name, "fr")),
    invoices: (invoices ?? []).map((f) => ({
      id: f.id,
      studentId: f.student_id,
      student: byId.get(f.student_id)?.name ?? "",
      label: f.label,
      amountCents: f.amount_cents,
      status: f.status,
      dueOn: f.due_on,
      paidOn: f.paid_on,
      method: f.method,
    })),
    classes: classes.map((c, i) => ({ id: c.id, name: c.name, studentIds: rosters[i].map((s) => s.id) })),
  };
}
