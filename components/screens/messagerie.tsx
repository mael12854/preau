"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { FOLDERS, MESSAGES } from "@/lib/mock";

/** Messagerie : dossiers / liste / lecture et réponse. */
export function MessagerieScreen() {
  const toast = useToast();
  const [current, setCurrent] = useState(0);
  const [read, setRead] = useState<number[]>([]);
  const [reply, setReply] = useState("");
  const readerRef = useRef<HTMLHeadingElement>(null);
  const m = MESSAGES[current];
  const unreadCount = MESSAGES.filter((x, i) => x.unread && !read.includes(i)).length;

  return (
    <div className="grid overflow-hidden rounded-card border border-line bg-surface lg:h-[41.25rem] lg:grid-cols-[11.25rem_21.25rem_minmax(0,1fr)] md:grid-cols-[18rem_minmax(0,1fr)]">
      <nav aria-label="Dossiers" className="flex flex-col gap-1 border-b border-line bg-surface-2 p-4 md:col-span-2 lg:col-span-1 lg:border-r lg:border-b-0">
        <Button icon="edit" className="mb-3 h-[2.625rem] w-full" onClick={() => toast({ title: "Nouveau message : brouillon créé" })}>
          Écrire
        </Button>
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0 lg:flex-col">
          {FOLDERS.map((f, i) => (
            <li key={f.key}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-current={i === 0 ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-[8px] px-2.5 text-label no-underline",
                  i === 0 ? "bg-brand-tint font-bold text-brand" : "text-ink-2 hover:bg-neutral-bg",
                )}
              >
                {f.label}
                {"count" in f && unreadCount > 0 && (
                  <span>
                    {unreadCount}
                    <span className="sr-only"> non lus</span>
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Messages reçus" className="max-h-[26rem] overflow-auto border-b border-line md:max-h-none md:border-r md:border-b-0">
        <ul className="m-0 list-none p-0">
          {MESSAGES.map((msg, i) => {
            const unread = msg.unread && !read.includes(i);
            return (
              <li key={msg.subject}>
                <button
                  type="button"
                  aria-current={i === current ? "true" : undefined}
                  onClick={() => {
                    setCurrent(i);
                    setRead((r) => (r.includes(i) ? r : [...r, i]));
                    setReply("");
                    if (window.matchMedia("(max-width: 47.99rem)").matches) readerRef.current?.focus();
                  }}
                  className={cn("flex w-full gap-3 border-b border-line-soft px-4 py-3.5 text-left", i === current ? "bg-brand-tint" : "bg-surface hover:bg-surface-2")}
                >
                  <Avatar initials={msg.initials} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex justify-between gap-2">
                      <span className={cn("text-label", unread && "font-bold")}>
                        {msg.from}
                        {unread && <span className="sr-only"> (non lu)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-ink-muted">{msg.date}</span>
                    </span>
                    <span className={cn("truncate text-label", unread && "font-bold")}>{msg.subject}</span>
                    <span className="truncate text-caption text-ink-muted">{msg.body.replace(/\n+/g, " ").slice(0, 70)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <article aria-labelledby="msg-subject" className="flex flex-col gap-[1.125rem] overflow-auto px-5 py-6 sm:px-8 sm:py-7">
        <h2 id="msg-subject" ref={readerRef} tabIndex={-1} className="m-0 font-display text-[1.5rem] leading-tight font-bold tracking-[-0.015em] outline-none">
          {m.subject}
        </h2>
        <div className="flex items-center gap-3">
          <Avatar initials={m.initials} size={40} />
          <div className="flex flex-col">
            <b className="text-ui">{m.from}</b>
            <span className="text-caption text-ink-muted">
              {m.role} · {m.date}
            </span>
          </div>
        </div>
        <div className="max-w-[38.75rem] text-lg leading-relaxed whitespace-pre-line">{m.body}</div>
        <form
          className="mt-auto flex items-end gap-3 rounded-alert border-[1.5px] border-line-strong p-3.5 focus-within:border-brand"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reply.trim()) return;
            setReply("");
            toast({ title: "Message envoyé", action: { label: "Annuler" } });
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
          <Button type="submit" className="h-[2.375rem]" disabled={!reply.trim()}>
            Envoyer
          </Button>
        </form>
      </article>
    </div>
  );
}
