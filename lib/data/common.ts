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
  classId: string,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("teachings")
    .select("subject_id, profiles(display_name)")
    .eq("class_id", classId);
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
