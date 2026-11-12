import "server-only";
import type { Viewer } from "@/lib/session";
import type { SupabaseServer } from "@/lib/supabase/server";
import { getPublishTargets, isAdminStaff } from "./targets";

import type { CouncilRole, CouncilStatus } from "@/lib/councils";

export type { CouncilRole, CouncilStatus };

export type CouncilSummary = {
  id: string;
  className: string;
  term: number;
  heldAt: string;
  status: CouncilStatus;
  headTeacher: string | null;
};

/** Conseils visibles (personnel de la classe, participants) et, pour l'administration, ce qu'il faut pour en créer. */
export async function getCouncils(supabase: SupabaseServer, viewer: Viewer) {
  const admin = viewer.id === "direction" || viewer.id === "secretariat";
  const teacher = viewer.id === "prof" || viewer.id === "enseignant-primaire";
  const [{ data }, targets, { data: profs }] = await Promise.all([
    supabase
      .from("class_councils")
      .select("id, term, held_at, status, classes(name), profiles!class_councils_head_teacher_id_fkey(display_name)")
      .order("held_at", { ascending: false }),
    admin || teacher ? getPublishTargets(supabase, viewer) : Promise.resolve(null),
    admin || teacher
      ? supabase.from("profiles").select("id, display_name").eq("kind", "prof").order("display_name")
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);
  const councils: CouncilSummary[] = (data ?? []).map((c) => ({
    id: c.id,
    className: c.classes?.name ?? "",
    term: c.term,
    heldAt: c.held_at,
    status: c.status,
    headTeacher: c.profiles?.display_name ?? null,
  }));
  return {
    councils,
    canCreate: admin || teacher,
    /** Un professeur qui crée un conseil en devient le professeur principal, sauf choix contraire. */
    selfId: teacher ? viewer.profileId : null,
    classes: targets?.classes ?? [],
    teachers: (profs ?? []).map((p) => ({ id: p.id, name: p.display_name })),
  };
}

export type CouncilSheet = {
  student_id: string;
  name: string;
  report_card_id: string;
  mention: string | null;
  council_text: string | null;
  absences: number;
  absences_unjustified: number;
  lates: number;
  subjects: {
    subject_id: string;
    subject: string;
    average: number | null;
    score: number | null;
    level: string | null;
    comment: string;
    results: string[];
  }[];
};

export type CouncilDetail = {
  id: string;
  className: string;
  classId: string;
  term: number;
  heldAt: string;
  periodStart: string;
  periodEnd: string;
  status: CouncilStatus;
  headTeacherId: string | null;
  headTeacher: string | null;
  participants: { id: string; name: string; role: CouncilRole }[];
  sheets: CouncilSheet[];
  /** Matières que la personne connectée remplit (professeur de la matière dans la classe ; toutes pour la direction). */
  mySubjects: { id: string; name: string }[];
  canManage: boolean;
  canAdvise: boolean;
  canEditLines: boolean;
  grading: "competences" | "note20";
  /** Personnes de l'école (administration), pour ajouter des participants. */
  people: { id: string; name: string; kind: string }[];
};

export async function getCouncil(supabase: SupabaseServer, viewer: Viewer, id: string): Promise<CouncilDetail | null> {
  const { data: c } = await supabase
    .from("class_councils")
    .select("id, class_id, term, held_at, period_start, period_end, status, head_teacher_id, classes(name), profiles!class_councils_head_teacher_id_fkey(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;
  const admin = viewer.id === "direction" || viewer.id === "secretariat";
  const direction = viewer.id === "direction";
  const isHead = c.head_teacher_id === viewer.profileId;
  const [{ data: participants }, sheets, { data: teachings }, { data: people }] = await Promise.all([
    supabase.from("class_council_participants").select("profile_id, role, profiles(display_name)").eq("council_id", id),
    isAdminStaff(viewer) || viewer.staff ? supabase.rpc("council_sheets", { p_council: id }) : Promise.resolve({ data: [] }),
    supabase.from("teachings").select("subject_id, teacher_id, subjects(name)").eq("class_id", c.class_id),
    admin || isHead
      ? supabase.from("profiles").select("id, display_name, kind").in("kind", ["prof", "cpe", "direction", "secretariat", "eleve", "parent"]).order("display_name")
      : Promise.resolve({ data: [] as { id: string; display_name: string; kind: string }[] }),
  ]);
  const subjects = [
    ...new Map(
      (teachings ?? [])
        .filter((t) => direction || t.teacher_id === viewer.profileId)
        .map((t) => [t.subject_id, { id: t.subject_id, name: t.subjects?.name ?? t.subject_id }]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return {
    id: c.id,
    className: c.classes?.name ?? "",
    classId: c.class_id,
    term: c.term,
    heldAt: c.held_at,
    periodStart: c.period_start,
    periodEnd: c.period_end,
    status: c.status,
    headTeacherId: c.head_teacher_id,
    headTeacher: c.profiles?.display_name ?? null,
    participants: (participants ?? [])
      .map((p) => ({ id: p.profile_id, name: p.profiles?.display_name ?? "", role: p.role as CouncilRole }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    sheets: ((sheets.data ?? []) as CouncilSheet[]) ?? [],
    mySubjects: subjects,
    canManage: admin || isHead,
    canAdvise: c.status !== "cloture" && (direction || (isHead && c.status === "en_cours")),
    canEditLines: c.status === "preparation" || (direction && c.status === "en_cours"),
    grading: viewer.grading,
    people: (people ?? []).map((p) => ({ id: p.id, name: p.display_name, kind: p.kind })),
  };
}
