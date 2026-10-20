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
  /** Autre fiche de la même personne, sur le même compte : « sa fiche élève »… (nul sinon). */
  sameAccount: string | null;
  /** Élève : classe principale et classes supplémentaires. */
  classId: string | null;
  extraClasses: { id: string; name: string }[];
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
    { data: members },
    { data: links },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, kind, first_name, last_name, civility, display_name, role_label, user_id",
      )
      .order("last_name")
      .order("display_name"),
    supabase.from("profile_private").select("profile_id, email"),
    supabase
      .from("students")
      .select("profile_id, class_id, classes!students_class_id_fkey(name)"),
    supabase
      .from("guardians")
      .select(
        "guardian_id, students(profiles!students_profile_id_fkey(display_name))",
      ),
    supabase
      .from("class_members")
      .select("student_id, class_id, classes(name)"),
    supabase.from("profile_links").select("profile_id, user_id"),
  ]);
  // Comptes partagés : une fiche principale (profiles.user_id) et ses fiches rattachées (profile_links).
  const KIND_LABEL: Record<string, string> = {
    eleve: "sa fiche élève",
    parent: "sa fiche parent",
    prof: "sa fiche enseignant",
    cpe: "sa fiche vie scolaire",
    direction: "sa fiche direction",
    secretariat: "sa fiche secrétariat",
  };
  const accountOf = new Map<string, string>();
  (people ?? []).forEach((p) => p.user_id && accountOf.set(p.id, p.user_id));
  (links ?? []).forEach((l) => accountOf.set(l.profile_id, l.user_id));
  const byAccount = new Map<string, string[]>();
  accountOf.forEach((u, id) =>
    byAccount.set(u, [...(byAccount.get(u) ?? []), id]),
  );
  const kindOf = new Map((people ?? []).map((p) => [p.id, p.kind]));
  const sameAccount = (id: string) => {
    const u = accountOf.get(id);
    const others = u
      ? (byAccount.get(u) ?? []).filter((x) => x !== id && kindOf.has(x))
      : [];
    return others.length
      ? `même compte que ${others.map((x) => KIND_LABEL[kindOf.get(x)!] ?? "une autre fiche").join(" et ")}`
      : null;
  };
  const extra = new Map<string, { id: string; name: string }[]>();
  (members ?? []).forEach((m) =>
    extra.set(m.student_id, [
      ...(extra.get(m.student_id) ?? []),
      { id: m.class_id, name: m.classes?.name ?? "" },
    ]),
  );
  const mainClass = new Map(
    (students ?? []).map((s) => [s.profile_id, s.class_id]),
  );
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
        ? [klass.get(p.id) ?? "", ...(extra.get(p.id) ?? []).map((c) => c.name)]
            .filter(Boolean)
            .join(" + ")
        : p.kind === "parent"
          ? (children.get(p.id) ?? [])
              .map((n) => `Responsable de ${n}`)
              .join(", ")
          : (p.role_label ?? ""),
    hasAccount: accountOf.has(p.id),
    sameAccount: sameAccount(p.id),
    classId: mainClass.get(p.id) ?? null,
    extraClasses: extra.get(p.id) ?? [],
  }));
}
