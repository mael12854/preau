"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { markRead, scheduleMessage, sendMessage } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { MessageView } from "@/lib/data/types";

type Folder = "recus" | "envoyes" | "archives";
const FOLDERS: { key: Folder | "brouillons"; label: string }[] = [
  { key: "recus", label: "Reçus" },
  { key: "envoyes", label: "Envoyés" },
  { key: "brouillons", label: "Brouillons" },
  { key: "archives", label: "Archivés" },
];

function Compose({ recipients }: { recipients: { value: string; label: string }[] }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  // Plusieurs destinataires : chacun ajouté depuis la liste, retirable.
  const [to, setTo] = useState<string[]>([]);
  const [picker, setPicker] = useState(0);
  // Envoi programmé : date et heure locales (heure de Paris), converties en ISO à l'envoi.
  const [later, setLater] = useState(false);
  const [at, setAt] = useState("");
  const [error, setError] = useState<string>();
  const labelOf = (id: string) => recipients.find((r) => r.value === id)?.label ?? id;
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
        if (!o) {
          setTo([]);
          setLater(false);
          setAt("");
        }
      }}
      title="Nouveau message"
      trigger={
        <Button icon="edit" className="mb-3 h-[2.625rem] w-full">
          Écrire
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (!to.length) return setError("Choisissez au moins un destinataire.");
          const when = later && at ? new Date(at) : null;
          if (later && (!when || when.getTime() < Date.now() + 60_000))
            return setError("Choisissez une date et une heure à venir.");
          start(async () => {
            const subject = String(f.get("objet"));
            const text = String(f.get("texte"));
            const r = when
              ? await scheduleMessage(to, subject, text, when.toISOString())
              : await sendMessage(to, subject, text);
            if (!r.ok) return setError(r.error);
            setOpen(false);
            toast({
              title: when
                ? `Envoi programmé le ${when.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à ${when.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : to.length > 1
                  ? `Message envoyé à ${to.length} destinataires`
                  : "Message envoyé",
            });
            setTo([]);
          });
        }}
      >
        <div className="flex flex-col gap-2">
          <SelectField
            key={picker}
            label={to.length ? "Ajouter un destinataire" : "Destinataires"}
            placeholder="Choisir une personne"
            options={recipients.filter((r) => !to.includes(r.value))}
            onValueChange={(v) => {
              setTo((t) => (t.includes(v) ? t : [...t, v]));
              setPicker((n) => n + 1);
            }}
          />
          {to.length > 0 && (
            <ul aria-label="Destinataires choisis" className="m-0 flex list-none flex-wrap gap-2 p-0">
              {to.map((id) => (
                <li key={id} className="flex items-center gap-1 rounded-full border border-line bg-brand-tint py-1 pr-1 pl-3 text-label">
                  {labelOf(id)}
                  <button
                    type="button"
                    onClick={() => setTo((t) => t.filter((x) => x !== id))}
                    aria-label={`Retirer ${labelOf(id)}`}
                    className="flex size-7 items-center justify-center rounded-full hover:bg-surface"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <TextField label="Objet" name="objet" required maxLength={200} />
        <TextAreaField label="Message" name="texte" required rows={6} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-label">
          <Checkbox checked={later} onCheckedChange={setLater} />
          Programmer l&apos;envoi
        </label>
        {later && (
          <TextField
            label="Envoyer le"
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            hint="Les destinataires recevront le message, et l'e-mail de notification, à cette date."
            required
          />
        )}
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" icon="send" disabled={pending}>
            {pending ? "Envoi…" : later ? "Programmer" : "Envoyer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Messagerie : dossiers / liste / lecture et réponse. */
export function MessagerieScreen({
  folder,
  messages,
  recipients,
  unreadCount,
}: {
  folder: Folder | "brouillons";
  messages: MessageView[];
  recipients: { value: string; label: string }[];
  unreadCount: number;
}) {
  const toast = useToast();
  const [current, setCurrent] = useState(0);
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();
  const [readIds, addRead] = useOptimistic<string[], string>([], (cur, id) => [...cur, id]);
  const readerRef = useRef<HTMLHeadingElement>(null);
  const m = messages[current];
  const isUnread = (x: MessageView) => x.unread && !readIds.includes(x.id);
  const unread = Math.max(0, unreadCount - messages.filter((x) => x.unread && readIds.includes(x.id)).length);

  const open = (i: number) => {
    setCurrent(i);
    setReply("");
    const msg = messages[i];
    if (isUnread(msg)) start(async () => {
      addRead(msg.id);
      await markRead(msg.id);
    });
    if (window.matchMedia("(max-width: 47.99rem)").matches) readerRef.current?.focus();
  };

  return (
    <div className="grid overflow-hidden rounded-card border border-line bg-surface md:grid-cols-[18rem_minmax(0,1fr)] lg:h-[41.25rem] lg:grid-cols-[11.25rem_21.25rem_minmax(0,1fr)]">
      <nav aria-label="Dossiers" className="flex flex-col gap-1 border-b border-line bg-surface-2 p-4 md:col-span-2 lg:col-span-1 lg:border-r lg:border-b-0">
        <Compose recipients={recipients} />
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0 lg:flex-col">
          {FOLDERS.map((f) => (
            <li key={f.key}>
              <Link
                href={f.key === "recus" ? "/messagerie" : `/messagerie?dossier=${f.key}`}
                aria-current={folder === f.key ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-[8px] px-2.5 text-label no-underline",
                  folder === f.key ? "bg-brand-tint font-bold text-brand" : "text-ink-2 hover:bg-neutral-bg",
                )}
              >
                {f.label}
                {f.key === "recus" && unread > 0 && (
                  <span>
                    {unread}
                    <span className="sr-only"> non lus</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Liste des messages" className="max-h-[26rem] overflow-auto border-b border-line md:max-h-none md:border-r md:border-b-0">
        {messages.length === 0 && (
          <p className="m-0 px-4 py-8 text-center text-ui text-ink-2">{folder === "brouillons" ? "Aucun brouillon." : "Aucun message dans ce dossier."}</p>
        )}
        <ul className="m-0 list-none p-0">
          {messages.map((msg, i) => {
            const u = isUnread(msg);
            return (
              <li key={msg.id}>
                <button
                  type="button"
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => open(i)}
                  className={cn("flex w-full gap-3 border-b border-line-soft px-4 py-3.5 text-left", i === current ? "bg-brand-tint" : "bg-surface hover:bg-surface-2")}
                >
                  <Avatar initials={msg.initials} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex justify-between gap-2">
                      <span className={cn("truncate text-label", u && "font-bold")}>
                        {msg.from}
                        {u && <span className="sr-only"> (non lu)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-ink-muted">{msg.date}</span>
                    </span>
                    <span className={cn("truncate text-label", u && "font-bold")}>{msg.subject}</span>
                    <span className="truncate text-caption text-ink-muted">{msg.body.replace(/\n+/g, " ").slice(0, 70)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {m ? (
        <article aria-labelledby="msg-subject" className="flex flex-col gap-[1.125rem] overflow-auto px-5 py-6 sm:px-8 sm:py-7">
          <h2 id="msg-subject" ref={readerRef} tabIndex={-1} className="m-0 font-display text-[1.5rem] leading-tight font-bold tracking-[-0.015em] outline-none">
            {m.subject}
          </h2>
          <div className="flex items-center gap-3">
            <Avatar initials={m.initials} size={40} />
            <div className="flex flex-col">
              <b className="text-ui">{m.from}</b>
              <span className="text-caption text-ink-muted">{[m.role, m.date].filter(Boolean).join(" · ")}</span>
            </div>
          </div>
          <div className="max-w-[38.75rem] text-lg leading-relaxed whitespace-pre-line">{m.body}</div>
          {folder !== "envoyes" && (
            <form
              className="mt-auto flex items-end gap-3 rounded-alert border-[1.5px] border-line-strong p-3.5 focus-within:border-brand has-[textarea:focus-visible]:outline-[3px] has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-accent has-[textarea:focus-visible]:outline-solid"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                start(async () => {
                  const subject = m.subject.startsWith("Re : ") ? m.subject : `Re : ${m.subject}`;
                  const r = await sendMessage([m.fromId], subject, reply, m.id);
                  if (!r.ok) return toast({ title: r.error });
                  setReply("");
                  toast({ title: "Message envoyé" });
                });
              }}
            >
              <label htmlFor="reponse" className="sr-only">
                Répondre à {m.from}
              </label>
              <textarea
                id="reponse"
                rows={1}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Répondre à ${m.from}…`}
                className="min-h-10 flex-1 resize-none self-center bg-transparent py-2 text-ui outline-none placeholder:text-ink-muted focus-visible:outline-none"
              />
              <Button type="submit" className="h-[2.375rem]" disabled={!reply.trim() || pending}>
                Envoyer
              </Button>
            </form>
          )}
        </article>
      ) : (
        <div className="hidden items-center justify-center p-8 text-ui text-ink-2 md:flex">Sélectionnez un message pour le lire.</div>
      )}
    </div>
  );
}
