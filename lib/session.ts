import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { now } from "@/lib/clock";
import { isoDay } from "@/lib/format";
import { PROFILES, type ModuleKey, type Profile, type ProfileId } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

/** Élève suivi : l'élève connecté, ou l'enfant d'un responsable. */
export type FollowedStudent = {
  id: string;
  firstName: string;
  name: string;
  classId: string;
  className: string;
};

/** Personne connectée, avec tout ce dont la coque a besoin. */
export type Viewer = Profile & {
  profileId: string;
  userId: string;
  school: { name: string; year: string; domain: string };
  student: FollowedStudent | null;
  counts: Partial<Record<ModuleKey, number>>;
};

const NAV = Object.fromEntries(PROFILES.map((p) => [p.id, p])) as Record<ProfileId, Profile>;

/** Lit la session et le profil (une seule fois par requête). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: me } = await supabase
    .from("profiles")
    .select("id, kind, first_name, last_name, civility, display_name, initials, role_label, specialities, schools(name, year_label, domain)")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!me) return null;

  let student: FollowedStudent | null = null;
  let level: "college" | "lycee" = "college";
  const studentId =
    me.kind === "eleve"
      ? me.id
      : me.kind === "parent"
        ? (await supabase.from("guardians").select("student_id").eq("guardian_id", me.id).limit(1).maybeSingle()).data?.student_id
        : undefined;
  if (studentId) {
    const { data: s } = await supabase
      .from("students")
      .select("profile_id, class_id, classes(name, level), profiles(first_name, display_name)")
      .eq("profile_id", studentId)
      .maybeSingle();
    if (s?.classes && s.profiles) {
      level = s.classes.level;
      student = {
        id: s.profile_id,
        firstName: s.profiles.first_name ?? s.profiles.display_name,
        name: s.profiles.display_name,
        classId: s.class_id,
        className: s.classes.name,
      };
    }
  }

  const variant: ProfileId = me.kind === "eleve" ? level : me.kind;
  const base = NAV[variant];
  const fullName = [me.first_name, me.last_name].filter(Boolean).join(" ") || me.display_name;
  const civility = me.civility === "madame" ? "Madame" : me.civility === "monsieur" ? "Monsieur" : "";
  const hello = me.kind === "eleve" ? `Bonjour ${me.first_name}` : `Bonjour ${civility} ${me.last_name ?? ""}`.replace(/\s+/g, " ").trim();
  const role =
    me.kind === "eleve"
      ? [student?.className, me.specialities].filter(Boolean).join(" · ")
      : me.kind === "parent" && student
        ? `Responsable de ${student.firstName} (${student.className})`
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
      ? supabase.from("homework").select("id").eq("class_id", student.classId).gt("due_on", today)
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
