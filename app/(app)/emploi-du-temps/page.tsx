import type { Metadata } from "next";
import Link from "next/link";
import { EdtScreen } from "@/components/screens/edt";
import { EdtExport } from "@/components/screens/edt-export";
import {
  AddLessonSeries,
  WeekLessonList,
} from "@/components/screens/edt-editor";
import { ClassGroupsEditor } from "@/components/screens/edt-groups";
import { SelectLink } from "@/components/screens/select-link";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { classStudents } from "@/lib/data/common";
import { getPublishTargets, isAdminStaff } from "@/lib/data/targets";
import { getWeekLessons } from "@/lib/data/timetable";
import { addDays, formatDateShort, isoDay, mondayOf } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Emploi du temps" };

/** Semaine A ou B : A, B, A, B… à partir de la semaine A de référence de l'établissement (un lundi). */
function weekAB(monday: string, reference: string) {
  const weeks = Math.round(
    (Date.parse(`${monday}T12:00:00Z`) - Date.parse(`${reference}T12:00:00Z`)) /
      (7 * 86_400_000),
  );
  return Math.abs(weeks) % 2 === 0 ? "A" : "B";
}

/** Fin de l'année scolaire en cours (début juillet). */
function endOfSchoolYear(today: string) {
  const year = Number(today.slice(0, 4));
  return `${today.slice(5) >= "07-05" ? year + 1 : year}-07-04`;
}

export default async function EdtPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string; classe?: string; eleve?: string }>;
}) {
  const profile = await requireModule("edt");
  const supabase = await createClient();
  const reference = now();
  const { semaine, classe, eleve } = await searchParams;
  const weekOf = /^\d{4}-\d{2}-\d{2}$/.test(semaine ?? "")
    ? semaine
    : undefined;

  // Administration : emploi du temps d'une classe au choix. Famille : ses classes. Professeur : ses cours.
  const admin = isAdminStaff(profile);
  const classes = admin
    ? ((await getPublishTargets(supabase, profile))?.classes ?? [])
    : [];
  const classId = admin
    ? (classes.find((c) => c.id === classe)?.id ?? classes[0]?.id ?? null)
    : null;
  // Administration : élèves et groupes de la classe, pour l'EDT nominatif et l'organisation des groupes.
  const [roster, { data: classGroups }, { data: memberships }] =
    admin && classId
      ? await Promise.all([
          classStudents(supabase, classId),
          supabase
            .from("class_groups")
            .select("id, name, family")
            .eq("class_id", classId)
            .order("family")
            .order("name"),
          supabase
            .from("student_class_groups")
            .select("student_id, family, group_id")
            .eq("class_id", classId),
        ])
      : [[], { data: [] }, { data: [] }];
  const pupil = roster.find((s) => s.id === eleve) ?? null;
  // EDT nominatif (élève, famille, ou élève choisi par l'administration) : classe entière + ses groupes.
  const scope = profile.student
    ? { classId: profile.student.classIds, studentId: profile.student.id }
    : admin
      ? { classId: classId ?? "", studentId: pupil?.id }
      : { teacherId: profile.profileId };
  const [week, { data: school }] = await Promise.all([
    getWeekLessons(supabase, scope, reference, weekOf),
    supabase.from("schools").select("week_a_monday").limit(1).maybeSingle(),
  ]);

  // Semaine vide : vacances en cours et semaine du prochain cours.
  const [holiday, nextLesson] = week.lessons.length
    ? [null, null]
    : await Promise.all([
        supabase
          .from("agenda_events")
          .select("title")
          .eq("is_holiday", true)
          .is("class_id", null)
          .lte("starts_on", addDays(week.monday, 6))
          .gte("ends_on", week.monday)
          .limit(1)
          .maybeSingle()
          .then((r) => r.data?.title ?? null),
        (() => {
          let q = supabase
            .from("lessons")
            .select("starts_at, classes!inner(hidden)")
            .eq("classes.hidden", false)
            .gte("starts_at", `${addDays(week.monday, 7)}T00:00:00Z`)
            .order("starts_at")
            .limit(1);
          q =
            "classId" in scope && scope.classId !== undefined
              ? q.in("class_id", ([] as string[]).concat(scope.classId))
              : q.eq("teacher_id", profile.profileId);
          return q.maybeSingle().then((r) => r.data?.starts_at ?? null);
        })(),
      ]);

  const href = (day: string) =>
    `/emploi-du-temps?semaine=${day}${classId ? `&classe=${classId}` : ""}${pupil ? `&eleve=${pupil.id}` : ""}`;
  const monday = week.monday;
  const nav = {
    label: `${pupil ? `${pupil.name} · ` : ""}Semaine du ${formatDateShort(monday)}${school ? ` · semaine ${weekAB(monday, school.week_a_monday)}` : ""}`,
    prev: href(addDays(monday, -7)),
    next: href(addDays(monday, 7)),
    current: href(mondayOf(isoDay(reference))),
  };
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Seul le secrétariat construit l'emploi du temps ; la direction et la vie scolaire le consultent.
  const manage = profile.id === "secretariat" && classId;
  const [{ data: subjects }, { data: teachers }, { data: klass }] = manage
    ? await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase
          .from("profiles")
          .select("id, display_name")
          .eq("kind", "prof")
          .order("display_name"),
        supabase
          .from("classes")
          .select("level, profiles!classes_teacher_id_fkey(display_name)")
          .eq("id", classId)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: [] }, { data: null }];
  const className = classes.find((c) => c.id === classId)?.name ?? "";
  const groupChoices = (classGroups ?? []).map((g) => ({
    id: g.id,
    name: `${g.name} (${g.family})`,
  }));

  return (
    <AppShell profile={profile} module="edt">
      <div className="edt-page flex flex-col gap-4">
        {admin && (
          <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
            {classes.length ? (
              <div className="flex flex-wrap items-end gap-3">
                <SelectLink
                  label="Classe"
                  value={classId ?? ""}
                  options={classes.map((c) => ({
                    value: c.id,
                    label: c.name,
                    href: `/emploi-du-temps?semaine=${monday}&classe=${c.id}`,
                  }))}
                />
                {roster.length > 0 && (
                  <SelectLink
                    label="Emploi du temps"
                    value={pupil?.id ?? "classe"}
                    options={[
                      {
                        value: "classe",
                        label: "Général (toute la classe)",
                        href: `/emploi-du-temps?semaine=${monday}&classe=${classId}`,
                      },
                      ...roster.map((s) => ({
                        value: s.id,
                        label: s.name,
                        href: `/emploi-du-temps?semaine=${monday}&classe=${classId}&eleve=${s.id}`,
                      })),
                    ]}
                  />
                )}
              </div>
            ) : (
              <p className="m-0 text-ui text-ink-2">
                Aucune classe dans l&apos;établissement.
              </p>
            )}
            {manage && (
              <AddLessonSeries
                classId={classId}
                className={className}
                subjects={(subjects ?? []).map((s) => ({
                  id: s.id,
                  name: s.name,
                }))}
                teachers={(teachers ?? []).map((t) => ({
                  id: t.id,
                  name: t.display_name,
                }))}
                titular={
                  klass?.level === "primaire"
                    ? (klass.profiles?.display_name ?? "")
                    : null
                }
                groups={groupChoices}
                defaultFrom={isoDay(reference)}
                defaultUntil={endOfSchoolYear(isoDay(reference))}
              />
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Impression : titre de l'emploi du temps (nom, classe, école). */}
          <h1 className="m-0 hidden font-display text-h2 font-bold print:block">
            Emploi du temps ·{" "}
            {profile.student
              ? `${profile.student.name} (${[profile.student.className, ...profile.student.extraClasses].join(" + ")})`
              : admin
                ? [className, pupil?.name].filter(Boolean).join(" · ")
                : profile.name}{" "}
            · {profile.school.name}
          </h1>
          <EdtExport
            pdfHref={`/emploi-du-temps/pdf?semaine=${monday}${classId ? `&classe=${classId}` : ""}${pupil ? `&eleve=${pupil.id}` : ""}`}
          />
        </div>
        <EdtScreen
          days={week.days}
          todayIndex={week.todayIndex}
          lessons={week.lessons}
          showClass={!profile.student}
          nav={nav}
          edit={
            manage
              ? {
                  mode: "manage",
                  me: profile.profileId,
                  subjects: (subjects ?? []).map((s) => ({
                    id: s.id,
                    name: s.name,
                  })),
                  teachers: (teachers ?? []).map((t) => ({
                    id: t.id,
                    name: t.display_name,
                  })),
                  titular:
                    klass?.level === "primaire"
                      ? (klass.profiles?.display_name ?? "")
                      : null,
                  dates,
                  groups: groupChoices,
                }
              : !profile.student && !admin
                ? {
                    mode: "teacher",
                    me: profile.profileId,
                    mine: profile.general ?? undefined,
                    subjects: [],
                    teachers: [],
                    titular: null,
                    dates,
                  }
                : undefined
          }
        />
        {week.lessons.length === 0 && (
          <p className="m-0 text-ui text-ink-2">
            {holiday
              ? `${holiday} : pas de cours cette semaine.`
              : admin
                ? "Aucun cours cette semaine pour cette classe."
                : profile.student
                  ? "Aucun cours cette semaine."
                  : "Aucun cours à votre nom cette semaine."}
            {nextLesson && (
              <>
                {" "}
                <Link
                  href={href(mondayOf(isoDay(nextLesson)))}
                  className="font-bold text-brand"
                >
                  Voir la semaine du prochain cours (
                  {formatDateShort(mondayOf(isoDay(nextLesson)))})
                </Link>
              </>
            )}
          </p>
        )}
        {manage && (
          <div className="print:hidden">
          <ClassGroupsEditor
            classId={classId}
            className={className}
            groups={classGroups ?? []}
            students={roster.map((s) => ({
              id: s.id,
              name: s.name,
              groups: Object.fromEntries(
                (memberships ?? [])
                  .filter((m) => m.student_id === s.id)
                  .map((m) => [m.family, m.group_id]),
              ),
            }))}
          />
          </div>
        )}
        {!profile.student && (
          <div className="print:hidden">
          <WeekLessonList
            lessons={week.lessons}
            days={week.days}
            dates={dates}
            canManage={profile.id === "secretariat"}
            me={profile.profileId}
            mine={profile.general ?? undefined}
          />
          </div>
        )}
      </div>
    </AppShell>
  );
}
