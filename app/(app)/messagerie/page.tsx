import type { Metadata } from "next";
import { MessagerieScreen } from "@/components/screens/messagerie";
import { AppShell } from "@/components/shell/app-shell";
import { Sections } from "@/components/shell/sections";
import { now } from "@/lib/clock";
import { getMessages, getRecipients, type Folder } from "@/lib/data/messages";
import { getSections, requireModule } from "@/lib/session";

export const metadata: Metadata = { title: "Messagerie" };

export default async function MessageriePage({ searchParams }: { searchParams: Promise<{ dossier?: string }> }) {
  const profile = await requireModule("messages");
  const { dossier } = await searchParams;
  const folder = dossier === "envoyes" || dossier === "archives" || dossier === "brouillons" ? dossier : "recus";
  const sections = await getSections(profile, "messages");
  const data = await Promise.all(
    sections.map(({ viewer, supabase }) =>
      Promise.all([
        folder === "brouillons" ? [] : getMessages(supabase, viewer.profileId, folder as Folder, now()),
        getRecipients(supabase, viewer),
      ]),
    ),
  );
  return (
    <AppShell profile={profile} module="messages">
      <Sections
        sections={sections}
        render={(s, i) => (
          <MessagerieScreen
            key={folder}
            folder={folder}
            messages={data[i][0]}
            recipients={data[i][1]}
            unreadCount={s.viewer.counts.messages ?? 0}
          />
        )}
      />
    </AppShell>
  );
}
