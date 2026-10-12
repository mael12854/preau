"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES, PREFERENCES_KEY, readPreferences, writePreferences, type Preferences } from "./preferences";

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Preferences } | null = null;

function snapshot(): Preferences {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PREFERENCES_KEY);
  } catch {
    /* stockage indisponible */
  }
  if (!cache || cache.raw !== raw) cache = { raw, value: readPreferences() };
  return cache.value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === PREFERENCES_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Préférences d'affichage partagées par toute l'application (localStorage + <html data-*>). */
export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFERENCES);
  const update = useCallback((patch: Partial<Preferences>) => {
    writePreferences({ ...snapshot(), ...patch });
    listeners.forEach((l) => l());
  }, []);
  return [prefs, update] as const;
}

/** Thème réellement affiché (résout « system » avec prefers-color-scheme). */
export function useEffectiveDark(prefs: Preferences): boolean {
  const systemDark = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
}
