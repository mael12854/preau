import type { ReactNode } from "react";
import { formatDateLong } from "@/lib/format";
import { TODAY } from "@/lib/mock/school";

/** Date du jour et salutation (« Bonjour Léa », « Bonjour Madame Martin »). */
export function Greeting({ hello, aside }: { hello: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="m-0 text-label text-ink-muted">{formatDateLong(TODAY, true)}</p>
        <p className="m-0 font-display text-[clamp(2rem,5vw,2.5rem)] leading-[1.1] font-extrabold tracking-[-0.04em]">{hello}</p>
      </div>
      {aside}
    </div>
  );
}

/** Indicateur chiffré (vie scolaire, tableau de bord personnel). */
export function Stat({ value, label, tone, size = "md" }: { value: string; label: string; tone?: "danger" | "warn" | "ok"; size?: "sm" | "md" | "lg" }) {
  const color = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-ink";
  return (
    <>
      <span className={`font-display font-extrabold tracking-[-0.03em] ${color} ${size === "lg" ? "text-hello" : size === "md" ? "text-[2.25rem] leading-tight" : "text-stat"}`}>
        {value}
      </span>
      <span className={size === "sm" ? "text-caption text-ink-2" : "text-label text-ink-2"}>{label}</span>
    </>
  );
}
