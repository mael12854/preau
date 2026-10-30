import { now } from "@/lib/clock";
import { renderClassListPdf } from "@/lib/class-list-pdf";
import { classStudents } from "@/lib/data/common";
import { getPublishTargets } from "@/lib/data/targets";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Liste de classe en PDF : administration (toutes les classes) ou professeur (ses classes). */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.staff) return new Response("Accès réservé au personnel.", { status: 403 });
  const supabase = await createClient();
  const classId = new URL(request.url).searchParams.get("classe") ?? "";
  const klass = (await getPublishTargets(supabase, viewer))?.classes.find((c) => c.id === classId);
  if (!klass) return new Response("Classe introuvable.", { status: 404 });

  const students = await classStudents(supabase, klass.id);
  const ids = students.map((s) => s.id);
  const [{ data: groups }, { data: guardians }] = ids.length
    ? await Promise.all([
        supabase.from("student_class_groups").select("student_id, class_groups(name)").eq("class_id", klass.id),
        supabase.from("guardians").select("student_id, profiles!guardians_guardian_id_fkey(display_name)").in("student_id", ids),
      ])
    : [{ data: [] }, { data: [] }];

  const bytes = await renderClassListPdf({
    className: klass.name,
    school: viewer.school.name,
    year: viewer.school.year,
    reference: now(),
    rows: students.map((s) => ({
      lastName: s.lastName || s.name,
      firstName: s.firstName,
      groups: (groups ?? [])
        .filter((g) => g.student_id === s.id && g.class_groups)
        .map((g) => g.class_groups!.name)
        .join(", "),
      guardians: (guardians ?? [])
        .filter((g) => g.student_id === s.id && g.profiles)
        .map((g) => g.profiles!.display_name)
        .join(", "),
    })),
  });
  const slug = klass.name.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="liste-${slug}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
