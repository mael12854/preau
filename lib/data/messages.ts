import "server-only";
import { classStudents } from "./common";
import { getPublishTargets } from "./targets";
import type { Viewer } from "@/lib/session";
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

export type Recipient = {
  value: string;
  label: string;
  /** Groupe (classe, demi-groupe, LV2…) : les personnes à qui le message part réellement. */
  members?: string[];
};

/**
 * Destinataires possibles. Tous : le personnel. Personnel : aussi les familles et les élèves,
 * et des groupes par classe (élèves, familles) et par groupe de classe (demi-groupe, LV2…).
 */
export async function getRecipients(supabase: SupabaseServer, viewer: Viewer): Promise<Recipient[]> {
  const kinds: ("prof" | "cpe" | "direction" | "secretariat" | "parent" | "eleve")[] = viewer.staff
    ? ["prof", "cpe", "direction", "secretariat", "parent", "eleve"]
    : ["prof", "cpe", "direction", "secretariat"];
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, title, kind")
    .neq("id", viewer.profileId)
    .in("kind", kinds)
    .order("display_name");
  const people: Recipient[] = (data ?? []).map((p) => ({
    value: p.id,
    label:
      p.kind === "eleve"
        ? `${p.display_name} · élève`
        : p.title
          ? `${p.display_name} · ${p.title}`
          : p.display_name,
  }));
  if (!viewer.staff) return people;

  const targets = await getPublishTargets(supabase, viewer);
  const classes = targets?.classes ?? [];
  if (!classes.length) return people;
  const rosters = await Promise.all(classes.map((c) => classStudents(supabase, c.id)));
  const studentIds = [...new Set(rosters.flat().map((s) => s.id))];
  const [{ data: guardians }, { data: groups }] = await Promise.all([
    studentIds.length
      ? supabase.from("guardians").select("student_id, guardian_id").in("student_id", studentIds)
      : Promise.resolve({ data: [] as { student_id: string; guardian_id: string }[] }),
    supabase
      .from("class_groups")
      .select("id, name, class_id, student_class_groups(student_id)")
      .in(
        "class_id",
        classes.map((c) => c.id),
      )
      .order("name"),
  ]);
  const familyOf = (ids: string[]) => [
    ...new Set((guardians ?? []).filter((g) => ids.includes(g.student_id)).map((g) => g.guardian_id)),
  ];

  const groupOptions: Recipient[] = [];
  classes.forEach((c, i) => {
    const ids = rosters[i].map((s) => s.id);
    if (!ids.length) return;
    groupOptions.push({ value: `classe:${c.id}:eleves`, label: `${c.name} · tous les élèves`, members: ids });
    const fam = familyOf(ids);
    if (fam.length) {
      groupOptions.push({ value: `classe:${c.id}:familles`, label: `${c.name} · toutes les familles`, members: fam });
      groupOptions.push({ value: `classe:${c.id}:tous`, label: `${c.name} · élèves et familles`, members: [...ids, ...fam] });
    }
    for (const g of (groups ?? []).filter((x) => x.class_id === c.id)) {
      const gIds = g.student_class_groups.map((m) => m.student_id).filter((id) => ids.includes(id));
      if (!gIds.length) continue;
      groupOptions.push({ value: `groupe:${g.id}`, label: `${c.name} · ${g.name} (élèves)`, members: gIds });
      const gFam = familyOf(gIds);
      if (gFam.length)
        groupOptions.push({ value: `groupe:${g.id}:tous`, label: `${c.name} · ${g.name} (élèves et familles)`, members: [...gIds, ...gFam] });
    }
  });
  return [...groupOptions, ...people];
}
