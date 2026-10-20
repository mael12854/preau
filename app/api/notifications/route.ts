import { sendMessageEmails } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Notifications dues (messages programmés arrivés à leur heure, envois immédiats manqués).
 * Appelé chaque minute par la base (pg_cron + pg_net). Sans effet s'il n'y a rien à envoyer :
 * chaque message n'est réservé qu'une fois.
 */
export async function GET() {
  const admin = createAdminClient();
  if (!admin) return Response.json({ sent: 0 });
  const { data: ids } = await admin.rpc("claim_due_notifications");
  for (const id of ids ?? []) await sendMessageEmails(id);
  return Response.json({ sent: ids?.length ?? 0 });
}
