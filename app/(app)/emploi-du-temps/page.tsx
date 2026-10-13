import type { Metadata } from "next";
import { EdtScreen } from "@/components/screens/edt";
import {
  AddLessonSeries,
  WeekLessonList,
} from "@/components/screens/edt-editor";
import { SelectLink } from "@/components/screens/select-link";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getPublishTargets, isAdminStaff, isManager } from "@/lib/data/targets";
import { getWeekLessons } from "@/lib/data/timetable";
import { addDays, formatDateShort, isoDay, mondayOf } from "@/lib/format";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Emploi du temps" };

/** Fin de l'année scolaire en cours (début juillet). */
function endOfSchoolYear(today: string) {
  const year = Number(today.slice(0, 4));
  return `${today.slice(5) >= "07-05" ? year + 1 : year}-07-04`;
}

export default async function EdtPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string; classe?: string }>;
}) {
  const profile = await requireModule("edt");
  const supabase = await createClient();
  const reference = now();
  const { semaine, classe } = await searchParams;
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
  const scope = profile.student
    ? { classId: profile.student.classIds }
    : admin
      ? { classId: classId ?? "" }
      : { teacherId: profile.profileId };
  const week = await getWeekLessons(supabase, scope, reference, weekOf);

  const href = (day: string) =>
    `/emploi-du-temps?semaine=${day}${classId ? `&classe=${classId}` : ""}`;
  const monday = week.monday;
  const nav = {
    label: `Semaine du ${formatDateShort(monday)}`,
    prev: href(addDays(monday, -7)),
    next: href(addDays(monday, 7)),
    current: href(mondayOf(isoDay(reference))),
  };
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const manage = isManager(profile) && classId;
  const [{ data: subjects }, { data: teachers }] = manage
    ? await Promise.all([
        supabase.from("subjects").select("id, name").order("name"),
        supabase
          .from("profiles")
          .select("id, display_name")
          .eq("kind", "prof")
          .order("display_name"),
      ])
    : [{ data: [] }, { data: [] }];
  const className = classes.find((c) => c.id === classId)?.name ?? "";

  return (
    <AppShell profile={profile} module="edt">
      <div className="flex flex-col gap-4">
        {admin && (
          <div className="flex flex-wrap items-end justify-between gap-3">
            {classes.length ? (
              <SelectLink
                label="Classe"
                value={classId ?? ""}
                options={classes.map((c) => ({
                  value: c.id,
                  label: c.name,
                  href: `/emploi-du-temps?semaine=${monday}&classe=${c.id}`,
                }))}
              />
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
                defaultFrom={isoDay(reference)}
                defaultUntil={endOfSchoolYear(isoDay(reference))}
              />
            )}
          </div>
        )}
        <EdtScreen
          days={week.days}
          todayIndex={week.todayIndex}
          lessons={week.lessons}
          showClass={!profile.student}
          nav={nav}
        />
        {week.lessons.length === 0 && (
          <p className="m-0 text-ui text-ink-2">
            {admin
              ? "Aucun cours cette semaine pour cette classe."
              : profile.student
                ? "Aucun cours cette semaine."
                : "Aucun cours à votre nom cette semaine."}
          </p>
        )}
        {!profile.student && (
          <WeekLessonList
            lessons={week.lessons}
            days={week.days}
            dates={dates}
            canManage={admin}
            me={profile.profileId}
          />
        )}
      </div>
    </AppShell>
  );
}
