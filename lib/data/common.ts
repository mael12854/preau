import "server-only";
import type { IconName } from "@/lib/icons";
import { ICON_NAMES } from "@/lib/icons";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { SubjectRef } from "./types";

export type SubjectMap = Record<string, SubjectRef & { skills: string[] }>;

export async function getSubjects(
  supabase: SupabaseServer,
): Promise<SubjectMap> {
  const { data } = await supabase
    .from("subjects")
    .select("id, name, hue, skills");
  return Object.fromEntries((data ?? []).map((s) => [s.id, s]));
}

/** Professeur de chaque matière pour une classe. */
export async function getTeachers(
  supabase: SupabaseServer,
  classId: string | string[],
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("teachings")
    .select("subject_id, profiles(display_name)")
    .in("class_id", ([] as string[]).concat(classId));
  return Object.fromEntries(
    (data ?? []).map((t) => [t.subject_id, t.profiles?.display_name ?? ""]),
  );
}

export function iconName(
  name: string,
  fallback: IconName = "description",
): IconName {
  return (ICON_NAMES as readonly string[]).includes(name)
    ? (name as IconName)
    : fallback;
}

export type ClassStudent = {
  id: string;
  name: string;
  initials: string;
  lastName: string;
  firstName: string;
};

/** Élèves d'une classe : ceux dont c'est la classe principale et ceux qui la suivent en plus (classes supplémentaires). */
export async function classStudents(
  supabase: SupabaseServer,
  classId: string,
): Promise<ClassStudent[]> {
  const fields = "display_name, initials, last_name, first_name";
  const [{ data: main }, { data: extra }] = await Promise.all([
    supabase
      .from("students")
      .select(`profile_id, profiles!students_profile_id_fkey(${fields})`)
      .eq("class_id", classId),
    supabase
      .from("class_members")
      .select(`student_id, students(profiles!students_profile_id_fkey(${fields}))`)
      .eq("class_id", classId),
  ]);
  const rows = [
    ...(main ?? []).map((s) => ({ id: s.profile_id, p: s.profiles })),
    ...(extra ?? []).map((m) => ({
      id: m.student_id,
      p: m.students?.profiles ?? null,
    })),
  ];
  return [...new Map(rows.map((r) => [r.id, r])).values()]
    .map((r) => ({
      id: r.id,
      name: r.p?.display_name ?? "",
      initials: r.p?.initials ?? "",
      lastName: r.p?.last_name ?? "",
      firstName: r.p?.first_name ?? "",
    }))
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, "fr") ||
        a.firstName.localeCompare(b.firstName, "fr"),
    );
}
