import type { Metadata } from "next";
import { MessagerieScreen } from "@/components/screens/messagerie";
import { AppShell } from "@/components/shell/app-shell";
import { now } from "@/lib/clock";
import { getMessages, getRecipients, type Folder } from "@/lib/data/messages";
import { requireModule } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messagerie" };

export default async function MessageriePage({ searchParams }: { searchParams: Promise<{ dossier?: string }> }) {
  const profile = await requireModule("messages");
  const { dossier } = await searchParams;
  const folder = dossier === "envoyes" || dossier === "archives" || dossier === "brouillons" ? dossier : "recus";
  const supabase = await createClient();
  const [messages, recipients] = await Promise.all([
    folder === "brouillons" ? [] : getMessages(supabase, profile.profileId, folder as Folder, now()),
    getRecipients(supabase, profile.profileId, profile.staff),
  ]);
  return (
    <AppShell profile={profile} module="messages">
      <MessagerieScreen key={folder} folder={folder} messages={messages} recipients={recipients} unreadCount={profile.counts.messages ?? 0} />
    </AppShell>
  );
}
