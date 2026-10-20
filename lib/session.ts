import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { now } from "@/lib/clock";
import { isoDay } from "@/lib/format";
import type { Grading } from "@/lib/grading";
import {
  PRIMARY_PROFILES,
  PROFILES,
  type ModuleKey,
  type Profile,
  type ProfileId,
} from "@/lib/navigation";
import {
  createClient,
  GENERAL_SPACE,
  PROFILE_COOKIE,
  type SupabaseServer,
} from "@/lib/supabase/server";

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
  /** Les espaces du compte (élève, parent…) quand il en a plusieurs ; l'espace actif est marqué. */
  spaces: { id: string; label: string; active: boolean }[];
  /** Espace « Général » : les fiches d'enseignant réunies (toutes les écoles) ; nul sinon. */
  general: string[] | null;
};

/** Cookie de l'enfant affiché pour un responsable (identifiant d'élève, vérifié à chaque lecture). */
export const CHILD_COOKIE = "preau-enfant";

const NAV = Object.fromEntries(PROFILES.map((p) => [p.id, p])) as Record<
  ProfileId,
  Profile
>;

/** Lit la session et le profil (une seule fois par requête). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // Fiche active : celle du cookie si elle appartient au compte, sinon la fiche principale.
  // La base applique la même règle (en-tête x-preau-profile) pour toutes les autorisations.
  const { data: mine } = await supabase.rpc("my_profiles");
  const wanted = (await cookies()).get(PROFILE_COOKIE)?.value;
  // Espace « Général » : un compte qui enseigne dans plusieurs écoles voit tout réuni.
  const profs = (mine ?? []).filter((p) => p.kind === "prof");
  const general = profs.length > 1 && wanted === GENERAL_SPACE;
  const active = general
    ? (profs.find((p) => p.is_primary) ?? profs[0])
    : (mine?.find((p) => p.id === wanted) ??
      mine?.find((p) => p.is_primary) ??
      mine?.[0]);
  if (!active) return null;
  const KIND: Record<string, string> = {
    eleve: "Élève",
    parent: "Parent",
    prof: "Enseignant",
    cpe: "Vie scolaire",
    direction: "Direction",
    secretariat: "Secrétariat",
  };
  const spaces = [
    ...(profs.length > 1
      ? [{ id: GENERAL_SPACE, label: "Général · toutes les écoles", active: general }]
      : []),
    ...(mine ?? []).map((p) => ({
      id: p.id,
      label: [KIND[p.kind] ?? p.kind, p.detail, p.school]
        .filter(Boolean)
        .join(" · "),
      active: !general && p.id === active.id,
    })),
  ];
  const viewer = await buildViewer(
    general ? await createClient(active.id) : supabase,
    auth.user,
    active.id,
    spaces,
  );
  if (!viewer || !general) return viewer;
  // Général : menu commun à toutes les fiches, messages non lus de toutes les écoles.
  const all = await getSpaceViewersFor(profs.map((p) => p.id), auth.user);
  const nav = [...new Set(all.flatMap((x) => x.viewer.nav))];
  return {
    ...viewer,
    nav: viewer.nav.concat(nav.filter((k) => !viewer.nav.includes(k))),
    school: { ...viewer.school, name: "Toutes les écoles" },
    general: profs.map((p) => p.id),
    counts: {
      ...viewer.counts,
      messages: all.reduce((n, x) => n + (x.viewer.counts.messages ?? 0), 0),
    },
  };
});

type AuthUser = { id: string; email?: string | null };

/** Une fiche, une école : la personne telle qu'elle apparaît dans cet espace, et son client. */
export type SpaceView = { viewer: Viewer; supabase: SupabaseServer };

// Mise en cache par valeurs (identifiants joints), pour ne construire chaque espace qu'une fois par requête.
const spaceViewers = cache(
  async (key: string, userId: string, email: string): Promise<SpaceView[]> => {
    const user = { id: userId, email };
    const rows = await Promise.all(
      key.split(",").map(async (id) => {
        const supabase = await createClient(id);
        const viewer = await buildViewer(supabase, user, id, []);
        return viewer ? { viewer, supabase } : null;
      }),
    );
    return rows.filter((r): r is SpaceView => !!r);
  },
);
const getSpaceViewersFor = (ids: string[], user: AuthUser) =>
  spaceViewers(ids.join(","), user.id, user.email ?? "");

/**
 * Sections d'une page : une par école dans l'espace « Général », sinon l'espace actif seul.
 * Chaque section a son propre client (agit au nom de sa fiche).
 */
export async function getSections(viewer: Viewer, module?: ModuleKey): Promise<SpaceView[]> {
  if (!viewer.general) return [{ viewer, supabase: await createClient() }];
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const all = await getSpaceViewersFor(viewer.general, auth.user);
  // Seules les écoles où ce module existe (ex. cahier de liaison : primaire).
  const some = module ? all.filter((s) => s.viewer.nav.includes(module)) : all;
  return some.length ? some : all.slice(0, 1);
}

async function buildViewer(
  supabase: SupabaseServer,
  authUser: AuthUser,
  activeId: string,
  spaces: Viewer["spaces"],
): Promise<Viewer | null> {
  const auth = { user: authUser };
  const { data: me } = await supabase
    .from("profiles")
    .select(
      "id, kind, first_name, last_name, civility, display_name, initials, role_label, specialities, schools(name, year_label, domain, grading)",
    )
    .eq("id", activeId)
    .maybeSingle();
  if (!me) return null;

  // Élève : lui-même. Responsable : tous ses enfants, l'enfant affiché étant choisi par cookie.
  type Level = "primaire" | "college" | "lycee";
  let level: Level = "college" as Level;
  const ids =
    me.kind === "eleve"
      ? [me.id]
      : me.kind === "parent"
        ? (
            (
              await supabase
                .from("guardians")
                .select("student_id")
                .eq("guardian_id", me.id)
            ).data ?? []
          ).map((g) => g.student_id)
        : [];
  const levels = new Map<string, Level>();
  let children: FollowedStudent[] = [];
  if (ids.length) {
    const [{ data: rows }, { data: extra }] = await Promise.all([
      supabase
        .from("students")
        .select(
          "profile_id, class_id, classes!students_class_id_fkey(name, level), profiles!students_profile_id_fkey(first_name, display_name)",
        )
        .in("profile_id", ids),
      supabase
        .from("class_members")
        .select("student_id, class_id, classes(name)")
        .in("student_id", ids),
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
          classIds: [
            s.class_id,
            ...(extra ?? [])
              .filter((m) => m.student_id === s.profile_id)
              .map((m) => m.class_id),
          ],
          extraClasses: (extra ?? [])
            .filter((m) => m.student_id === s.profile_id)
            .map((m) => m.classes?.name ?? ""),
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
      supabase
        .from("teachings")
        .select("classes(level)")
        .eq("teacher_id", me.id),
      supabase
        .from("classes")
        .select("name")
        .eq("teacher_id", me.id)
        .eq("level", "primaire")
        .order("name"),
    ]);
    // Titulaire d'une ou deux classes : leurs noms ; de plus : leur nombre (« 7 classes »).
    const names = (own ?? []).map((c) => c.name);
    primaryClass =
      names.length > 2
        ? `${names.length} classes`
        : names.length
          ? names.join(" et ")
          : null;
    primaryTeacher =
      names.length > 0 &&
      (t ?? []).every((x) => x.classes?.level === "primaire");
  }
  // Administration d'une école primaire : toutes les classes de l'établissement sont du primaire.
  let primarySchool = false;
  if (
    me.kind === "cpe" ||
    me.kind === "direction" ||
    me.kind === "secretariat"
  ) {
    const { data: levels } = await supabase.from("classes").select("level");
    primarySchool =
      !!levels?.length && levels.every((c) => c.level === "primaire");
  }
  const variant: ProfileId =
    me.kind === "eleve"
      ? level
      : me.kind === "parent"
        ? level === "primaire"
          ? "parent-primaire"
          : "parent"
        : me.kind === "prof" && primaryTeacher
          ? "enseignant-primaire"
          : me.kind;
  const base = NAV[variant];
  const fullName =
    [me.first_name, me.last_name].filter(Boolean).join(" ") || me.display_name;
  const civility =
    me.civility === "madame"
      ? "Madame"
      : me.civility === "monsieur"
        ? "Monsieur"
        : "";
  const hello =
    me.kind === "eleve"
      ? `Bonjour ${me.first_name}`
      : `Bonjour ${civility} ${me.last_name ?? ""}`.replace(/\s+/g, " ").trim();
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
    school: {
      name: me.schools?.name ?? "",
      year: me.schools?.year_label ?? "",
      domain: me.schools?.domain ?? "",
    },
    student,
    children: me.kind === "parent" ? children : [],
    scale:
      PRIMARY_PROFILES.includes(variant) || primarySchool
        ? "primaire"
        : "college",
    grading: me.schools?.grading ?? "competences",
    spaces: spaces.length > 1 ? spaces : [],
    general: null,
    counts: await navCounts(
      supabase,
      me.id,
      student,
      me.kind === "eleve" || me.kind === "parent",
      auth.user.id,
    ),
  };
}

async function navCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  student: FollowedStudent | null,
  family: boolean,
  userId: string,
): Promise<Partial<Record<ModuleKey, number>>> {
  const today = isoDay(now());
  const [{ count: unread }, homework, done] = await Promise.all([
    supabase
      .from("message_recipients")
      .select("message_id", { count: "exact", head: true })
      .eq("recipient_id", profileId)
      .is("read_at", null)
      .is("archived_at", null),
    family && student
      ? supabase
          .from("homework")
          .select("id")
          .in("class_id", student.classIds)
          .gt("due_on", today)
      : Promise.resolve({ data: [] as { id: string }[] }),
    family
      ? supabase
          .from("homework_done")
          .select("homework_id")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] as { homework_id: string }[] }),
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
