import "server-only";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";

/** Ce qu'une personne du personnel peut publier (documents, agenda) et pour quelles classes. */
export type PublishTargets = {
  classes: { id: string; name: string }[];
  /** Administration : tout l'établissement et toutes les classes. */
  wholeSchool: boolean;
  /** Professeur : seulement ses classes. */
  teacher: boolean;
};

export const isAdminStaff = (p: Viewer) =>
  p.id === "cpe" || p.id === "direction" || p.id === "secretariat";
export const isManager = (p: Viewer) =>
  p.id === "direction" || p.id === "secretariat";
export const isTeacher = (p: Viewer) =>
  p.id === "prof" || p.id === "enseignant-primaire";

/** Classes proposées : tout l'établissement pour l'administration, ses classes pour un professeur ; null sinon. */
export async function getPublishTargets(
  supabase: SupabaseServer,
  profile: Viewer,
): Promise<PublishTargets | null> {
  if (isAdminStaff(profile)) {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .order("name");
    return { classes: data ?? [], wholeSchool: true, teacher: false };
  }
  if (!isTeacher(profile)) return null;
  const [{ data: t }, { data: own }] = await Promise.all([
    supabase
      .from("teachings")
      .select("classes(id, name)")
      .eq("teacher_id", profile.profileId),
    supabase
      .from("classes")
      .select("id, name")
      .eq("teacher_id", profile.profileId),
  ]);
  const all = [
    ...(t ?? []).flatMap((x) => (x.classes ? [x.classes] : [])),
    ...(own ?? []),
  ];
  const classes = [...new Map(all.map((c) => [c.id, c])).values()].sort(
    (a, b) => a.name.localeCompare(b.name, "fr"),
  );
  return classes.length ? { classes, wholeSchool: false, teacher: true } : null;
}
