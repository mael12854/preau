import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { now } from "@/lib/clock";
import { isoDay } from "@/lib/format";
import type { Grading } from "@/lib/grading";
import { PRIMARY_PROFILES, PROFILES, type ModuleKey, type Profile, type ProfileId } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

/** Élève suivi : l'élève connecté, ou l'enfant d'un responsable. */
export type FollowedStudent = {
  id: string;
  firstName: string;
  name: string;
  /** Classe principale. */
  classId: string;
  className: string;
  /** Classe principale et classes supplémentaires (« Cours Sup »…) : emploi du temps, devoirs, liaison… */
  classIds: string[];
  /** Noms des classes supplémentaires. */
  extraClasses: string[];
};

/** Personne connectée, avec tout ce dont la coque a besoin. */
export type Viewer = Profile & {
  profileId: string;
  userId: string;
  school: { name: string; year: string; domain: string };
  student: FollowedStudent | null;
  /** Tous les enfants d'un responsable (vide pour les autres profils). */
  children: FollowedStudent[];
  /** Échelle d'affichage des évaluations : collège/lycée (MI → TB) ou livret scolaire du primaire. */
  scale: "college" | "primaire";
  /** Mode de notation de l'établissement : compétences, ou note sur 20 (sans moyenne). */
  grading: Grading;
  counts: Partial<Record<ModuleKey, number>>;
};

/** Cookie de l'enfant affiché pour un responsable (identifiant d'élève, vérifié à chaque lecture). */
export const CHILD_COOKIE = "preau-enfant";

const NAV = Object.fromEntries(PROFILES.map((p) => [p.id, p])) as Record<ProfileId, Profile>;

/** Lit la session et le profil (une seule fois par requête). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: me } = await supabase
    .from("profiles")
    .select("id, kind, first_name, last_name, civility, display_name, initials, role_label, specialities, schools(name, year_label, domain, grading)")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!me) return null;

  // Élève : lui-même. Responsable : tous ses enfants, l'enfant affiché étant choisi par cookie.
  type Level = "primaire" | "college" | "lycee";
  let level: Level = "college" as Level;
  const ids =
    me.kind === "eleve"
      ? [me.id]
      : me.kind === "parent"
        ? ((await supabase.from("guardians").select("student_id").eq("guardian_id", me.id)).data ?? []).map((g) => g.student_id)
        : [];
  const levels = new Map<string, Level>();
  let children: FollowedStudent[] = [];
  if (ids.length) {
    const [{ data: rows }, { data: extra }] = await Promise.all([
      supabase.from("students").select("profile_id, class_id, classes!students_class_id_fkey(name, level), profiles!students_profile_id_fkey(first_name, display_name)").in("profile_id", ids),
      supabase.from("class_members").select("student_id, class_id, classes(name)").in("student_id", ids),
    ]);
    children = (rows ?? [])
      .filter((s) => s.classes && s.profiles)
      .map((s) => {
        levels.set(s.profile_id, s.classes!.level);
        return {
          id: s.profile_id,
          firstName: s.profiles!.first_name ?? s.profiles!.display_name,
          name: s.profiles!.display_name,
          classId: s.class_id,
          className: s.classes!.name,
          classIds: [s.class_id, ...(extra ?? []).filter((m) => m.student_id === s.profile_id).map((m) => m.class_id)],
          extraClasses: (extra ?? []).filter((m) => m.student_id === s.profile_id).map((m) => m.classes?.name ?? ""),
        };
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName, "fr"));
  }
  const chosen = (await cookies()).get(CHILD_COOKIE)?.value;
  const student = children.find((c) => c.id === chosen) ?? children[0] ?? null;
  if (student) level = levels.get(student.id) ?? level;

  // Enseignant du primaire : titulaire d'une classe de primaire, et toutes ses classes sont du primaire.
  let primaryTeacher = false;
  let primaryClass: string | null = null;
  if (me.kind === "prof") {
    const [{ data: t }, { data: own }] = await Promise.all([
      supabase.from("teachings").select("classes(level)").eq("teacher_id", me.id),
      supabase.from("classes").select("name").eq("teacher_id", me.id).eq("level", "primaire").order("name"),
    ]);
    // Titulaire d'une ou deux classes : leurs noms ; de plus : leur nombre (« 7 classes »).
    const names = (own ?? []).map((c) => c.name);
    primaryClass = names.length > 2 ? `${names.length} classes` : names.length ? names.join(" et ") : null;
    primaryTeacher = names.length > 0 && (t ?? []).every((x) => x.classes?.level === "primaire");
  }
  // Administration d'une école primaire : toutes les classes de l'établissement sont du primaire.
  let primarySchool = false;
  if (me.kind === "cpe" || me.kind === "direction" || me.kind === "secretariat") {
    const { data: levels } = await supabase.from("classes").select("level");
    primarySchool = !!levels?.length && levels.every((c) => c.level === "primaire");
  }
  const variant: ProfileId =
    me.kind === "eleve"
      ? level
      : me.kind === "parent"
        ? level === "primaire" ? "parent-primaire" : "parent"
        : me.kind === "prof" && primaryTeacher
          ? "enseignant-primaire"
          : me.kind;
  const base = NAV[variant];
  const fullName = [me.first_name, me.last_name].filter(Boolean).join(" ") || me.display_name;
  const civility = me.civility === "madame" ? "Madame" : me.civility === "monsieur" ? "Monsieur" : "";
  const hello = me.kind === "eleve" ? `Bonjour ${me.first_name}` : `Bonjour ${civility} ${me.last_name ?? ""}`.replace(/\s+/g, " ").trim();
  const role =
    me.kind === "eleve"
      ? [student?.className, me.specialities].filter(Boolean).join(" · ")
      : me.kind === "parent" && student
        ? `Responsable de ${student.firstName} (${student.className})`
        : primaryTeacher && primaryClass
          ? `${me.civility === "madame" ? "Professeure" : "Professeur"} des écoles · ${primaryClass}`
          : (me.role_label ?? base.role);

  return {
    ...base,
    name: fullName,
    role,
    initials: me.initials,
    hello,
    email: auth.user.email ?? "",
    profileId: me.id,
    userId: auth.user.id,
    school: { name: me.schools?.name ?? "", year: me.schools?.year_label ?? "", domain: me.schools?.domain ?? "" },
    student,
    children: me.kind === "parent" ? children : [],
    scale: PRIMARY_PROFILES.includes(variant) || primarySchool ? "primaire" : "college",
    grading: me.schools?.grading ?? "competences",
    counts: await navCounts(supabase, me.id, student, me.kind === "eleve" || me.kind === "parent", auth.user.id),
  };
});

async function navCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  student: FollowedStudent | null,
  family: boolean,
  userId: string,
): Promise<Partial<Record<ModuleKey, number>>> {
  const today = isoDay(now());
  const [{ count: unread }, homework, done] = await Promise.all([
    supabase.from("message_recipients").select("message_id", { count: "exact", head: true })
      .eq("recipient_id", profileId).is("read_at", null).is("archived_at", null),
    family && student
      ? supabase.from("homework").select("id").in("class_id", student.classIds).gt("due_on", today)
      : Promise.resolve({ data: [] as { id: string }[] }),
    family ? supabase.from("homework_done").select("homework_id").eq("user_id", userId) : Promise.resolve({ data: [] as { homework_id: string }[] }),
  ]);
  const doneIds = new Set((done.data ?? []).map((d) => d.homework_id));
  const todo = (homework.data ?? []).filter((h) => !doneIds.has(h.id)).length;
  return { messages: unread ?? 0, devoirs: todo };
}

/** Renvoie la personne connectée si elle a accès au module, sinon redirige. */
export async function requireModule(key: ModuleKey): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    // Connecté mais sans fiche dans l'établissement : compte à rattacher par le secrétariat.
    const { data } = await (await createClient()).auth.getUser();
    redirect(data.user ? "/compte-non-rattache" : "/connexion");
  }
  if (!viewer.nav.includes(key)) redirect("/accueil");
  return viewer;
}
