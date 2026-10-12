import "server-only";
import type { SupabaseServer } from "@/lib/supabase/server";

export type PersonView = {
  id: string;
  kind: "eleve" | "parent" | "prof" | "cpe" | "direction" | "secretariat";
  firstName: string;
  lastName: string;
  civility: "madame" | "monsieur" | null;
  displayName: string;
  email: string;
  detail: string;
  hasAccount: boolean;
};

/** Annuaire de l'établissement (secrétariat, direction) : la RLS limite à l'établissement de la personne connectée. */
export async function getDirectory(
  supabase: SupabaseServer,
): Promise<PersonView[]> {
  const [
    { data: people },
    { data: emails },
    { data: students },
    { data: guardians },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, kind, first_name, last_name, civility, display_name, role_label, user_id",
      )
      .order("last_name")
      .order("display_name"),
    supabase.from("profile_private").select("profile_id, email"),
    supabase.from("students").select("profile_id, classes(name)"),
    supabase
      .from("guardians")
      .select("guardian_id, students(profiles(display_name))"),
  ]);
  const email = new Map(
    (emails ?? []).map((e) => [e.profile_id, e.email ?? ""]),
  );
  const klass = new Map(
    (students ?? []).map((s) => [s.profile_id, s.classes?.name ?? ""]),
  );
  const children = new Map<string, string[]>();
  (guardians ?? []).forEach((g) => {
    const name = g.students?.profiles?.display_name;
    if (name)
      children.set(g.guardian_id, [
        ...(children.get(g.guardian_id) ?? []),
        name,
      ]);
  });
  return (people ?? []).map((p) => ({
    id: p.id,
    kind: p.kind,
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    civility: p.civility,
    displayName: p.display_name,
    email: email.get(p.id) ?? "",
    detail:
      p.kind === "eleve"
        ? (klass.get(p.id) ?? "")
        : p.kind === "parent"
          ? (children.get(p.id) ?? [])
              .map((n) => `Responsable de ${n}`)
              .join(", ")
          : (p.role_label ?? ""),
    hasAccount: !!p.user_id,
  }));
}
