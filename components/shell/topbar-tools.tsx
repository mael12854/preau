"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type SearchEntry = { label: string; href: string };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Recherche dans les rubriques (280 px, repliée en icône sur petit écran) et accès aux messages non lus. */
export function TopbarTools({ entries, unread, inbox }: { entries: SearchEntry[]; unread: number; inbox: string | null }) {
  const router = useRouter();
  const listId = useId();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const results = q ? entries.filter((e) => fold(e.label).includes(q)) : [];

  const close = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) {
            router.push(results[0].href);
            close();
          }
        }}
        className={cn(
          "relative h-10 items-center gap-2 rounded-control border border-line bg-surface px-3 text-ink-muted focus-within:border-brand focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-accent focus-within:outline-solid",
          searchOpen ? "absolute inset-x-4 top-4 z-10 flex md:static md:w-70" : "hidden md:flex md:w-70",
        )}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <Icon name="search" />
        <label htmlFor="recherche" className="sr-only">
          Rechercher une rubrique
        </label>
        <input
          id="recherche"
          type="search"
          placeholder="Rechercher"
          autoComplete="off"
          aria-controls={listId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
          onKeyDown={(e) => e.key === "Escape" && close()}
          autoFocus={searchOpen}
        />
        {q && (
          <div id={listId} className="absolute inset-x-0 top-[calc(100%+0.375rem)] z-20 overflow-hidden rounded-control border border-line bg-surface shadow-lg">
            {results.length === 0 ? (
              <p role="status" className="m-0 px-3 py-2.5 text-label text-ink-muted">
                Aucune rubrique ne correspond.
              </p>
            ) : (
              <ul className="m-0 list-none p-1">
                {results.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} onClick={close} className="block rounded-[8px] px-2.5 py-2 text-label text-ink no-underline hover:bg-neutral-bg focus-visible:bg-neutral-bg">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
      <button
        type="button"
        aria-label="Rechercher"
        onClick={() => setSearchOpen(true)}
        className={cn("size-10 items-center justify-center rounded-control border border-line bg-surface md:hidden", searchOpen ? "hidden" : "flex")}
      >
        <Icon name="search" />
      </button>
      {inbox && (
        <Link
          href={inbox}
          aria-label={unread ? `Messagerie, ${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}` : "Messagerie, aucun message non lu"}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink"
        >
          <Icon name="notifications" size={21} />
          {unread > 0 && <span aria-hidden="true" className="absolute top-2 right-[0.5625rem] size-2 rounded-full bg-accent" />}
        </Link>
      )}
    </>
  );
}
