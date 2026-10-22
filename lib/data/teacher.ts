import "server-only";
import type { EvalValue } from "@/lib/evaluation";
import {
  addDays,
  formatDateShort,
  formatTimeGrid,
  formatTimeText,
  isoDay,
} from "@/lib/format";
import type { StaffDashboard } from "./staff";
import type { SupabaseServer } from "@/lib/supabase/server";
import { classStudents } from "./common";
import type { StudentRow } from "./types";

type Lesson = {
  id: string;
  starts_at: string;
  ends_at: string;
  room: string;
  cancelled: boolean;
  attendance_validated_at: string | null;
  class_id: string;
  group_id: string | null;
  classes: { name: string } | null;
  subjects: { name: string } | null;
  class_groups: { name: string } | null;
};

async function todayLessons(
  supabase: SupabaseServer,
  teacherId: string,
  reference: Date,
): Promise<Lesson[]> {
  const day = isoDay(reference);
  const { data } = await supabase
    .from("lessons")
    .select(
      "id, starts_at, ends_at, room, cancelled, attendance_validated_at, class_id, group_id, classes!inner(name), subjects(name), class_groups(name)",
    )
    .eq("classes.hidden", false)
    .eq("teacher_id", teacherId)
    .gte(
      "starts_at",
      new Date(
        new Date(`${day}T00:00:00Z`).getTime() - 3 * 3600_000,
      ).toISOString(),
    )
    .lt("starts_at", `${addDays(day, 1)}T00:00:00Z`)
    .order("starts_at");
  return (data ?? []).filter((l) => isoDay(l.starts_at) === day);
}

/** Tableau de bord du professeur, calculé depuis la base. */
export async function getTeacherDashboard(
  supabase: SupabaseServer,
  teacherId: string,
  reference: Date,
): Promise<StaffDashboard> {
  const today = isoDay(reference);
  const [lessons, { data: open }, { data: unread }, { data: events }] =
    await Promise.all([
      todayLessons(supabase, teacherId, reference),
      supabase
        .from("assessments")
        .select("id, title, held_on, classes(name), assessment_results(level)")
        .eq("teacher_id", teacherId)
        .is("published_at", null),
      supabase
        .from("message_recipients")
        .select(
          "messages!inner(subject, profiles!messages_sender_id_fkey(display_name, title))",
        )
        .eq("recipient_id", teacherId)
        .is("read_at", null),
      supabase
        .from("agenda_events")
        .select("title, starts_on")
        .gte("starts_on", today)
        .lte("starts_on", addDays(today, 7))
        .eq("is_holiday", false)
        .order("starts_on"),
    ]);

  const toCall = lessons.filter(
    (l) => !l.cancelled && !l.attendance_validated_at,
  );
  const toEnter = (open ?? [])
    .flatMap((a) => a.assessment_results)
    .filter((r) => r.level === "NE").length;
  const firstOpen = open?.[0];

  return {
    kpis: [
      {
        value: String(toCall.length),
        label: "Appels à faire aujourd'hui",
        tone: toCall.length ? "danger" : undefined,
      },
      {
        value: String(toEnter),
        label: firstOpen
          ? `Évaluations à saisir · ${firstOpen.classes?.name}`
          : "Évaluations à saisir",
      },
      { value: String(unread?.length ?? 0), label: "Messages non lus" },
    ],
    listTitle: "Mes cours aujourd'hui",
    empty: "Aucun cours aujourd'hui.",
    list: lessons.map((l) => {
      const started = new Date(l.starts_at) <= reference;
      const base = {
        time: formatTimeGrid(l.starts_at),
        title: `${l.classes?.name} · ${l.subjects?.name}`,
        sub: `Salle ${l.room}`,
      };
      if (l.cancelled)
        return { ...base, tone: "neutral" as const, status: "Annulé" };
      if (l.attendance_validated_at)
        return {
          ...base,
          tone: "ok" as const,
          status: "Appel fait",
          action: "Revoir l'appel",
          href: `/appel?cours=${l.id}`,
        };
      if (started)
        return {
          ...base,
          tone: "danger" as const,
          status: "Appel à faire",
          action: "Faire l'appel",
          href: `/appel?cours=${l.id}`,
        };
      return { ...base, tone: "neutral" as const, status: "À venir" };
    }),
    todo: [
      ...(open ?? []).map((a) => ({
        icon: "edit_note" as const,
        title: `Évaluer « ${a.title} »`,
        sub: `${a.classes?.name} · ${formatDateShort(a.held_on)}`,
      })),
      ...(unread ?? [])
        .filter((r) => r.messages.profiles?.title?.startsWith("Responsable"))
        .map((r) => ({
          icon: "mail" as const,
          title: `Message de ${r.messages.profiles?.display_name}`,
          sub: r.messages.subject,
        })),
      ...(events ?? []).slice(0, 2).map((e) => ({
        icon: "event" as const,
        title: e.title,
        sub: formatDateShort(e.starts_on),
      })),
    ],
  };
}

export type AppelData = {
  lesson: {
    id: string;
    label: string;
    detail: string;
    validated: boolean;
  } | null;
  /** Cours du jour du professeur, pour passer de l'un à l'autre. */
  todayLessons: { id: string; label: string }[];
  students: StudentRow[];
  attendance: Record<string, "present" | "absent" | "late">;
  assessment: {
    id: string;
    title: string;
    label: string;
    heldOn: string;
    term: number;
    skills: string[];
    grid: Record<string, EvalValue[]>;
    /** Notes sur 20 par élève (établissements notés sur 20). */
    scores: Record<string, { score: number | null; status: EvalValue }>;
    published: boolean;
  } | null;
  evalStudents: StudentRow[];
  /** Évaluations du professeur, pour choisir celle à saisir (la plus récente non publiée d'abord). */
  assessments: { id: string; label: string }[];
};

/** Élèves de la classe, y compris ceux qui la suivent en classe supplémentaire. */
async function roster(
  supabase: SupabaseServer,
  classId: string,
): Promise<StudentRow[]> {
  return (await classStudents(supabase, classId)).map(
    ({ id, name, initials }) => ({ id, name, initials }),
  );
}

/** Cours à appeler (en cours ou le plus proche non validé) et évaluation en cours de saisie. */
export async function getAppel(
  supabase: SupabaseServer,
  teacherId: string,
  reference: Date,
  assessmentId?: string,
  lessonId?: string,
): Promise<AppelData> {
  const lessons = (await todayLessons(supabase, teacherId, reference)).filter(
    (l) => !l.cancelled,
  );
  // Cours demandé par son lien (tableau de bord, emploi du temps), même un autre jour ; sinon le cours en cours.
  const { data: asked } = lessonId
    ? await supabase
        .from("lessons")
        .select(
          "id, starts_at, ends_at, room, cancelled, attendance_validated_at, class_id, group_id, classes!inner(name), subjects(name), class_groups(name)",
        )
        .eq("id", lessonId)
        .eq("teacher_id", teacherId)
        .maybeSingle()
    : { data: null };
  const current =
    (asked as Lesson | null) ??
    lessons.find(
      (l) =>
        new Date(l.starts_at) <= reference && reference < new Date(l.ends_at),
    ) ??
    lessons.find((l) => !l.attendance_validated_at) ??
    null;

  let students: StudentRow[] = [];
  let classRoster: StudentRow[] = [];
  const attendance: AppelData["attendance"] = {};
  if (current) {
    classRoster = await roster(supabase, current.class_id);
    students = classRoster;
    // Cours de groupe (demi-groupe, LV2, option) : seuls les élèves du groupe sont appelés.
    if (current.group_id) {
      const { data: members } = await supabase
        .from("student_class_groups")
        .select("student_id")
        .eq("group_id", current.group_id);
      const ids = new Set((members ?? []).map((m) => m.student_id));
      students = students.filter((s) => ids.has(s.id));
    }
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("lesson_id", current.id);
    students.forEach((s) => (attendance[s.id] = "present"));
    (data ?? []).forEach((a) => (attendance[a.student_id] = a.status));
  }

  const { data: list } = await supabase
    .from("assessments")
    .select("id, title, held_on, published_at, classes(name), subjects(name)")
    .eq("teacher_id", teacherId)
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("held_on", { ascending: false })
    .limit(100);
  const chosen = list?.find((x) => x.id === assessmentId) ?? list?.[0];
  const { data: a } = chosen
    ? await supabase
        .from("assessments")
        .select(
          "id, title, held_on, term, skills, published_at, class_id, classes(name), subjects(name), assessment_results(student_id, skill_levels, score, level)",
        )
        .eq("id", chosen.id)
        .maybeSingle()
    : { data: null };
  let evalStudents: StudentRow[] = [];
  let assessment: AppelData["assessment"] = null;
  if (a) {
    evalStudents =
      a.class_id === current?.class_id
        ? classRoster
        : await roster(supabase, a.class_id);
    const grid: Record<string, EvalValue[]> = {};
    evalStudents.forEach((s) => (grid[s.id] = a.skills.map(() => "NE")));
    a.assessment_results.forEach(
      (r) =>
        (grid[r.student_id] = a.skills.map(
          (_, i) => (r.skill_levels[i] ?? "NE") as EvalValue,
        )),
    );
    const scores: Record<string, { score: number | null; status: EvalValue }> =
      {};
    evalStudents.forEach((s) => (scores[s.id] = { score: null, status: "NE" }));
    a.assessment_results.forEach(
      (r) => (scores[r.student_id] = { score: r.score, status: r.level }),
    );
    assessment = {
      id: a.id,
      title: a.title,
      label: `${a.classes?.name} · ${a.subjects?.name}`,
      heldOn: a.held_on,
      term: a.term,
      skills: a.skills,
      grid,
      scores,
      published: !!a.published_at,
    };
  }

  const lessonLabel = (l: Lesson) =>
    `${formatTimeText(l.starts_at)} · ${l.classes?.name}${l.class_groups ? ` (${l.class_groups.name})` : ""} · ${l.subjects?.name}${l.attendance_validated_at ? " · appel fait" : ""}`;
  const choices = lessons.some((l) => l.id === current?.id) || !current ? lessons : [current, ...lessons];
  return {
    todayLessons: choices.map((l) => ({
      id: l.id,
      label: l.id === current?.id && !lessons.some((x) => x.id === l.id) ? `${formatDateShort(l.starts_at)} ${lessonLabel(l)}` : lessonLabel(l),
    })),
    lesson: current && {
      id: current.id,
      label: `${current.classes?.name}${current.class_groups ? ` (${current.class_groups.name})` : ""} · ${current.subjects?.name}`,
      detail: `${formatDateShort(current.starts_at)} · ${formatTimeText(current.starts_at)} – ${formatTimeText(current.ends_at)} · Salle ${current.room}`,
      validated: !!current.attendance_validated_at,
    },
    students,
    attendance,
    assessment,
    evalStudents,
    assessments: (list ?? []).map((x) => ({
      id: x.id,
      label: `${x.title} · ${x.classes?.name ?? ""} · ${x.subjects?.name ?? ""} · ${formatDateShort(x.held_on)}${x.published_at ? " · publiée" : ""}`,
    })),
  };
}
