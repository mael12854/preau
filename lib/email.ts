import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE = "https://logiciel-preau.vercel.app";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * E-mail « Vous avez un message sur Préau » aux destinataires d'un message (Brevo, API transactionnelle).
 * Sans BREVO_API_KEY, ne fait rien. Le contenu du message n'est pas recopié : il se lit sur Préau.
 * Les destinataires qui ont coupé les notifications « messages » (Mon compte) ne reçoivent rien.
 */
export async function notifyNewMessage(messageId: string) {
  const admin = createAdminClient();
  if (!admin) return;
  // Une seule notification par message (envoi immédiat ou programmé), et pas avant sa date d'envoi.
  const { data: claimed } = await admin.rpc("claim_message_notification", { p_message: messageId });
  if (claimed) await sendMessageEmails(messageId);
}

/** Envoie les e-mails d'un message déjà réservé (claim_message_notification ou claim_due_notifications). */
export async function sendMessageEmails(messageId: string) {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.PREAU_MAIL_FROM;
  const admin = createAdminClient();
  if (!key || !from || !admin) {
    console.warn("[préau] e-mail de notification non envoyé : configuration incomplète", {
      brevo: !!key, expediteur: !!from, serviceRole: !!admin,
    });
    return;
  }
  const { data: targets, error } = await admin.rpc("message_email_targets", { p_message: messageId });
  if (error) console.error("[préau] destinataires de la notification introuvables", error.message);
  if (error || !targets?.length) return;

  await Promise.all(
    targets.map(async (t) => {
      const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F5F3EC;font-family:Arial,Helvetica,sans-serif;color:#1C2421">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:14px;border:1px solid #E2DED2">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:22px;font-weight:bold;color:#1F5C4A">préau</p>
<p style="margin:4px 0 0;font-size:13px;color:#5E6B66">${escape(t.school_name)}</p></td></tr>
<tr><td style="padding:16px 28px"><p style="margin:0 0 12px;font-size:16px">Bonjour ${escape(t.recipient_name)},</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.5">Vous avez un nouveau message de <b>${escape(t.sender_name)}</b> sur Préau&nbsp;:</p>
<p style="margin:0 0 20px;padding:12px 14px;background:#F5F3EC;border-radius:10px;font-size:15px"><b>${escape(t.subject)}</b></p>
<p style="margin:0 0 24px"><a href="${SITE}/messagerie" style="display:inline-block;background:#1F5C4A;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">Lire le message</a></p>
<p style="margin:0;font-size:13px;color:#5E6B66;line-height:1.5">Pour ne plus recevoir ces e-mails, décochez « Messages » dans Mon compte, sur Préau.</p></td></tr>
</table></td></tr></table></body></html>`;
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "Préau", email: from },
          to: [{ email: t.email, name: t.recipient_name }],
          subject: `Nouveau message sur Préau : ${t.subject}`,
          htmlContent: html,
          textContent: `Bonjour ${t.recipient_name},\n\nVous avez un nouveau message de ${t.sender_name} sur Préau : « ${t.subject} ».\nLisez-le sur ${SITE}/messagerie\n\nPour ne plus recevoir ces e-mails, décochez « Messages » dans Mon compte.`,
        }),
      })
        .then(async (res) => {
          if (!res.ok) console.error("[préau] Brevo a refusé l'e-mail", res.status, (await res.text()).slice(0, 300));
          else console.log("[préau] e-mail de notification envoyé", res.status);
        })
        .catch((e) => console.error("[préau] Brevo injoignable", String(e)));
    }),
  );
}
