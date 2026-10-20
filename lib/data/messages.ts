import "server-only";
import { formatDateShort, formatRelative, formatTimeText } from "@/lib/format";
import type { SupabaseServer } from "@/lib/supabase/server";
import type { MessageView } from "./types";

export type Folder = "recus" | "envoyes" | "archives";

const SELECT =
  "id, subject, body, sent_at, profiles!messages_sender_id_fkey(id, display_name, initials, title)";

/** Messages d'un dossier pour la personne connectée. */
export async function getMessages(
  supabase: SupabaseServer,
  profileId: string,
  folder: Folder,
  reference: Date,
) {
  if (folder === "envoyes") {
    const { data } = await supabase
      .from("messages")
      .select(`${SELECT}, message_recipients(profiles(display_name))`)
      .eq("sender_id", profileId)
      .order("sent_at", { ascending: false });
    return (data ?? []).map((m): MessageView => {
      const to = m.message_recipients
        .map((r) => r.profiles?.display_name)
        .filter(Boolean)
        .join(", ");
      return {
        id: m.id,
        initials: m.profiles?.initials ?? "",
        from: `À : ${to}`,
        fromId: m.profiles?.id ?? "",
        role: m.profiles?.title ?? "",
        subject: m.subject,
        body: m.body,
        unread: false,
        scheduled: new Date(m.sent_at) > reference,
        // Envoi programmé : pas encore visible des destinataires.
        date:
          new Date(m.sent_at) > reference
            ? `Programmé · ${formatDateShort(m.sent_at)} à ${formatTimeText(m.sent_at)}`
            : formatRelative(m.sent_at, reference),
      };
    });
  }
  let q = supabase
    .from("message_recipients")
    .select(`read_at, messages!inner(${SELECT})`)
    .eq("recipient_id", profileId);
  q =
    folder === "archives"
      ? q.not("archived_at", "is", null)
      : q.is("archived_at", null);
  const { data } = await q;
  return (data ?? [])
    .sort((a, b) => b.messages.sent_at.localeCompare(a.messages.sent_at))
    .map(
      (r): MessageView => ({
        id: r.messages.id,
        initials: r.messages.profiles?.initials ?? "",
        from: r.messages.profiles?.display_name ?? "",
        fromId: r.messages.profiles?.id ?? "",
        role: r.messages.profiles?.title ?? "",
        subject: r.messages.subject,
        body: r.messages.body,
        unread: !r.read_at,
        date: formatRelative(r.messages.sent_at, reference),
      }),
    );
}

/** Destinataires possibles : le personnel de l'établissement (et les familles pour le personnel). */
export async function getRecipients(
  supabase: SupabaseServer,
  profileId: string,
  staff: boolean,
) {
  let q = supabase
    .from("profiles")
    .select("id, display_name, title, kind")
    .neq("id", profileId)
    .order("display_name");
  q = staff
    ? q.in("kind", ["prof", "cpe", "direction", "secretariat", "parent"])
    : q.in("kind", ["prof", "cpe", "direction", "secretariat"]);
  const { data } = await q;
  return (data ?? []).map((p) => ({
    value: p.id,
    label: p.title ? `${p.display_name} · ${p.title}` : p.display_name,
  }));
}
