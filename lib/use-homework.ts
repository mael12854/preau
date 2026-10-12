"use client";

import { useCallback, useSyncExternalStore } from "react";
import { HOMEWORK_DONE_DEFAULT } from "@/lib/mock/devoirs";

/** Coche « fait » des devoirs : personnelle, stockée sur l'appareil, jamais visible du professeur. */
const KEY = "preau-devoirs-faits";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: string[] } | null = null;
const DEFAULT = HOMEWORK_DONE_DEFAULT;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (!cache || cache.raw !== raw) {
    let value = DEFAULT;
    try {
      if (raw) value = JSON.parse(raw) as string[];
    } catch {}
    cache = { raw, value };
  }
  return cache.value;
}

export function useHomeworkDone() {
  const done = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT,
  );
  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      cache = { raw: JSON.stringify(next), value: next };
    }
    listeners.forEach((l) => l());
  }, []);
  return [done, toggle] as const;
}
