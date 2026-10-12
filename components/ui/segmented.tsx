"use client";

import { Tabs as RTabs, ToggleGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TRACK = "flex w-fit max-w-full gap-1 overflow-x-auto rounded-control bg-segmented p-1 whitespace-nowrap";
const ITEM =
  "relative min-h-9 rounded-[7px] px-3.5 text-label text-ink-2 transition-colors after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] " +
  "hover:text-ink data-[state=active]:bg-segmented-thumb data-[state=active]:font-bold data-[state=active]:text-ink data-[state=active]:shadow-thumb " +
  "data-[state=on]:bg-segmented-thumb data-[state=on]:font-bold data-[state=on]:text-ink data-[state=on]:shadow-thumb";

type Option = { value: string; label: string };

type SegmentedControlProps = {
  "aria-label": string;
  options: Option[];
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
};

/** Contrôle segmenté : choix exclusif (trimestre, taille du texte…). */
export function SegmentedControl({ options, value, onValueChange, className, ...aria }: SegmentedControlProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      aria-label={aria["aria-label"]}
      className={cn(TRACK, className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item key={o.value} value={o.value} className={ITEM}>
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

type SegmentedTabsProps = {
  "aria-label": string;
  tabs: (Option & { content: ReactNode })[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  /** Contenu affiché à droite des onglets (contexte du cours…). */
  aside?: ReactNode;
  className?: string;
};

/** Onglets au style segmenté (Appel / Évaluation). */
export function SegmentedTabs({ tabs, aside, className, ...rest }: SegmentedTabsProps) {
  const { "aria-label": label, ...root } = rest;
  return (
    <RTabs.Root className={cn("flex flex-col gap-4", className)} {...root}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <RTabs.List aria-label={label} className={TRACK}>
          {tabs.map((t) => (
            <RTabs.Trigger key={t.value} value={t.value} className={cn(ITEM, "px-4 font-bold text-ink")}>
              {t.label}
            </RTabs.Trigger>
          ))}
        </RTabs.List>
        {aside}
      </div>
      {tabs.map((t) => (
        <RTabs.Content key={t.value} value={t.value} className="focus-visible:outline-offset-4">
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}
