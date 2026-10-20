import { now } from "@/lib/clock";
import { classStudents } from "@/lib/data/common";
import { getPublishTargets, isAdminStaff } from "@/lib/data/targets";
import { getWeekLessons } from "@/lib/data/timetable";
import { renderEdtPdf } from "@/lib/edt-pdf";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Emploi du temps de la semaine en PDF (A4 paysage) : mêmes règles d'accès et de choix que la page. */
export async function GET(request: Request) {
  const profile = await requireModule("edt");
  const supabase = await createClient();
  const reference = now();
  const params = new URL(request.url).searchParams;
  const semaine = params.get("semaine") ?? "";
  const weekOf = /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? semaine : undefined;

  const admin = isAdminStaff(profile);
  const classes = admin ? ((await getPublishTargets(supabase, profile))?.classes ?? []) : [];
  const klass = admin ? (classes.find((c) => c.id === params.get("classe")) ?? classes[0] ?? null) : null;
  const roster = admin && klass ? await classStudents(supabase, klass.id) : [];
  const pupil = roster.find((s) => s.id === params.get("eleve")) ?? null;
  const scope = profile.student
    ? { classId: profile.student.classIds, studentId: profile.student.id }
    : admin
      ? { classId: klass?.id ?? "", studentId: pupil?.id }
      : { teacherId: profile.profileId };
  const week = await getWeekLessons(supabase, scope, reference, weekOf);

  const who = profile.student
    ? `${profile.student.name} · ${[profile.student.className, ...profile.student.extraClasses].join(" + ")}`
    : admin
      ? [klass?.name, pupil?.name].filter(Boolean).join(" · ") || "Classe"
      : profile.name;

  const bytes = await renderEdtPdf({
    who,
    school: profile.school.name,
    week,
    reference,
    showClass: !profile.student,
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="emploi-du-temps-${week.monday}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
