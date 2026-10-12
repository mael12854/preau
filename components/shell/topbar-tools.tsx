"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Recherche (280 px, repliée en icône sur petit écran) et notifications. */
export function TopbarTools() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className={cn(
          "h-10 items-center gap-2 rounded-control border border-line bg-surface px-3 text-ink-muted focus-within:border-brand focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-accent focus-within:outline-solid",
          searchOpen
            ? "absolute inset-x-4 top-4 z-10 flex md:static md:w-70"
            : "hidden md:flex md:w-70",
        )}
      >
        <Icon name="search" />
        <label htmlFor="recherche" className="sr-only">
          Rechercher
        </label>
        <input
          id="recherche"
          type="search"
          placeholder="Rechercher"
          className="h-full min-w-0 flex-1 bg-transparent text-label text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
          onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
          onBlur={() => setSearchOpen(false)}
          autoFocus={searchOpen}
        />
      </form>
      <button
        type="button"
        aria-label="Rechercher"
        onClick={() => setSearchOpen(true)}
        className={cn("size-10 items-center justify-center rounded-control border border-line bg-surface md:hidden", searchOpen ? "hidden" : "flex")}
      >
        <Icon name="search" />
      </button>
      <button
        type="button"
        aria-label="Notifications, nouvelles notifications disponibles"
        className="relative flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink"
      >
        <Icon name="notifications" size={21} />
        <span aria-hidden="true" className="absolute top-2 right-[0.5625rem] size-2 rounded-full bg-accent" />
      </button>
    </>
  );
}
