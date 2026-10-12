"use client";

import { useOptimistic, useTransition } from "react";
import { setHomeworkDone } from "@/app/(app)/actions";
import { useToast } from "@/components/ui/toast";

/** Coche personnelle des devoirs, enregistrée dans Supabase avec mise à jour immédiate. */
export function useDone(initial: string[]) {
  const toast = useToast();
  const [, start] = useTransition();
  const [done, setDone] = useOptimistic(initial, (cur: string[], { id, value }: { id: string; value: boolean }) =>
    value ? [...cur, id] : cur.filter((x) => x !== id),
  );
  const toggle = (id: string) => {
    const value = !done.includes(id);
    start(async () => {
      setDone({ id, value });
      const r = await setHomeworkDone(id, value);
      if (!r.ok) toast({ title: r.error });
    });
  };
  return [done, toggle] as const;
}
