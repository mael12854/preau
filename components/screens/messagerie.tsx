"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { markRead, sendMessage } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const [to, setTo] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
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
          if (!to) return setError("Choisissez un destinataire.");
          start(async () => {
            const r = await sendMessage([to], String(f.get("objet")), String(f.get("texte")));
            if (!r.ok) return setError(r.error);
            setOpen(false);
            toast({ title: "Message envoyé" });
          });
        }}
      >
        <SelectField label="Destinataire" placeholder="Choisir une personne" options={recipients} value={to} onValueChange={setTo} />
        <TextField label="Objet" name="objet" required maxLength={200} />
        <TextAreaField label="Message" name="texte" required rows={6} />
        {error && <p role="alert" className="m-0 text-label text-danger">{error}</p>}
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" icon="send" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer"}
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
