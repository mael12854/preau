import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/tone";

export type { Tone };

export const TONE_CLASSES: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  danger: "bg-danger-bg text-danger",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-tone-bg text-neutral",
  inverse: "bg-inverse text-on-inverse",
  brand: "bg-brand text-on-brand",
};

type BadgeProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

/** Badge de statut : rayon 6, texte en gras. Le libellé porte toujours le sens, pas seulement la couleur. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-badge px-2 py-1 text-meta leading-none font-bold whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Compteur orange (navigation, messages non lus). */
export function Counter({ count, label, className }: { count: number; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-[0.4375rem] py-px text-xs font-bold text-on-accent",
        className,
      )}
    >
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
