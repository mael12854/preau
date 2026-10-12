"use server";

import { revalidatePath } from "next/cache";
import type { EvalValue } from "@/lib/evaluation";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/** Résultat d'une action : message lisible en cas d'échec (jamais de code d'erreur brut). */
export type ActionResult = { ok: true } | { ok: false; error: string };

const FAILED = "L'enregistrement n'a pas abouti. Réessayez dans un instant.";

async function run(fn: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { message: string } | null }>, paths: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await fn(supabase);
  if (error) {
    // Les messages des fonctions SQL sont rédigés pour l'utilisateur ; les autres restent génériques.
    const readable = /^[A-ZÉÈ][^:]*\.?$/.test(error.message) && !/permission|violates|syntax/i.test(error.message);
    return { ok: false, error: readable ? error.message : FAILED };
  }
  paths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

/** Coche personnelle d'un devoir. */
export async function setHomeworkDone(homeworkId: string, done: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run(
    (s) => (done ? s.from("homework_done").insert({ homework_id: homeworkId }) : s.from("homework_done").delete().eq("homework_id", homeworkId).eq("user_id", viewer.userId)),
    ["/accueil", "/devoirs"],
  );
}

export async function justifyEvent(eventId: string, reason: string, comment: string): Promise<ActionResult> {
  return run((s) => s.rpc("justify_life_event", { p_event: eventId, p_reason: reason, p_comment: comment }), ["/vie-scolaire", "/accueil"]);
}

export async function validateAttendance(lessonId: string, statuses: Record<string, "present" | "absent" | "late">): Promise<ActionResult> {
  return run((s) => s.rpc("validate_attendance", { p_lesson: lessonId, p_statuses: statuses }), ["/appel", "/accueil"]);
}

export async function setSkillLevels(assessmentId: string, studentId: string, levels: EvalValue[]): Promise<ActionResult> {
  // Le niveau global reste « non évalué » : il n'est jamais calculé à partir des compétences (pas de moyenne).
  return run((s) => s.rpc("set_assessment_result", { p_assessment: assessmentId, p_student: studentId, p_level: "NE", p_skill_levels: levels }), []);
}

export async function publishAssessment(assessmentId: string): Promise<ActionResult> {
  return run((s) => s.rpc("publish_assessment", { p_assessment: assessmentId }), ["/appel", "/accueil", "/evaluations"]);
}

export async function sendMessage(recipients: string[], subject: string, body: string, replyTo?: string): Promise<ActionResult> {
  if (!body.trim()) return { ok: false, error: "Écrivez votre message avant de l'envoyer." };
  if (!subject.trim()) return { ok: false, error: "Indiquez un objet." };
  return run((s) => s.rpc("send_message", { p_recipients: recipients, p_subject: subject, p_body: body, p_reply_to: replyTo }), ["/messagerie"]);
}

export async function markRead(messageId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run(
    (s) => s.from("message_recipients").update({ read_at: new Date().toISOString() }).eq("message_id", messageId).eq("recipient_id", viewer.profileId).is("read_at", null),
    ["/messagerie", "/accueil"],
  );
}

export async function archiveMessage(messageId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run(
    (s) => s.from("message_recipients").update({ archived_at: new Date().toISOString() }).eq("message_id", messageId).eq("recipient_id", viewer.profileId),
    ["/messagerie"],
  );
}

export async function topUpCanteen(studentId: string, euros: number): Promise<ActionResult> {
  return run((s) => s.rpc("top_up_canteen", { p_student: studentId, p_amount_cents: Math.round(euros * 100) }), ["/paiements"]);
}

export async function payInvoice(invoiceId: string): Promise<ActionResult> {
  return run((s) => s.rpc("pay_invoice", { p_invoice: invoiceId }), ["/paiements"]);
}

export async function signDocument(documentId: string): Promise<ActionResult> {
  return run((s) => s.rpc("sign_document", { p_document: documentId }), ["/documents"]);
}

export async function updatePhone(phone: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  const clean = phone.trim();
  if (clean && !/^[+\d][\d\s.]{7,19}$/.test(clean)) return { ok: false, error: "Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78." };
  return run((s) => s.from("profile_private").update({ phone: clean || null }).eq("profile_id", viewer.profileId), ["/compte"]);
}

export async function updateNotifications(settings: Record<string, boolean>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: FAILED };
  return run((s) => s.from("profile_private").update({ notification_settings: settings }).eq("profile_id", viewer.profileId), ["/compte"]);
}
