"use client";

import { Checkbox as RCheckbox, RadioGroup as RRadioGroup, Switch as RSwitch } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/* ── Case à cocher ───────────────────────────────────────────── */

type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Libellé visible. Pour une case sans libellé visible, passez `aria-label`. */
  label?: ReactNode;
  "aria-label"?: string;
  /** Taille de la case : 22 (liste) ou 26 (devoirs). */
  size?: 22 | 26;
  className?: string;
  id?: string;
};

export function Checkbox({ checked, defaultChecked, onCheckedChange, label, size = 22, className, id, ...aria }: CheckboxProps) {
  const auto = useId();
  const cid = id ?? auto;
  const box = (
    <RCheckbox.Root
      id={cid}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(c) => onCheckedChange?.(c === true)}
      aria-label={aria["aria-label"]}
      className={cn(
        // Zone cliquable étendue à 44 px autour de la case
        "relative flex shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-line-strong bg-surface text-on-brand",
        "after:absolute after:-inset-2.5 after:content-[''] data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        size === 26 && "rounded-[7px]",
      )}
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
    >
      <RCheckbox.Indicator className="flex">
        <Icon name="check" size={size === 26 ? 19 : 18} />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
  if (!label) return <span className={className}>{box}</span>;
  return (
    <span className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      {box}
      <label htmlFor={cid} className="cursor-pointer text-md">
        {label}
      </label>
    </span>
  );
}

/* ── Boutons radio ───────────────────────────────────────────── */

type RadioGroupProps = {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export function RadioGroup({ label, options, orientation = "horizontal", className, ...rest }: RadioGroupProps) {
  const gid = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={gid} className="text-label font-bold">
        {label}
      </span>
      <RRadioGroup.Root
        aria-labelledby={gid}
        orientation={orientation}
        className={cn("flex gap-x-6 gap-y-1", orientation === "vertical" ? "flex-col" : "flex-wrap")}
        {...rest}
      >
        {options.map((o) => {
          const id = `${gid}-${o.value}`;
          return (
            <span key={o.value} className="inline-flex min-h-11 items-center gap-2">
              <RRadioGroup.Item
                id={id}
                value={o.value}
                className="relative size-[1.375rem] shrink-0 rounded-full border-[1.5px] border-line-strong bg-surface after:absolute after:-inset-2.5 after:content-[''] data-[state=checked]:border-[6px] data-[state=checked]:border-brand"
              />
              <label htmlFor={id} className="cursor-pointer text-md">
                {o.label}
              </label>
            </span>
          );
        })}
      </RRadioGroup.Root>
    </div>
  );
}

/* ── Interrupteur ────────────────────────────────────────────── */

type SwitchProps = {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  /** Ligne de réglage pleine largeur (Mon compte) : libellé à gauche, interrupteur à droite. */
  row?: boolean;
};

export function Switch({ label, description, checked, defaultChecked, onCheckedChange, className, row }: SwitchProps) {
  const id = useId();
  const control = (
    <RSwitch.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="group relative flex h-6 w-[2.625rem] shrink-0 items-center rounded-full bg-line-strong p-[3px] transition-colors after:absolute after:-inset-2.5 after:content-[''] data-[state=checked]:bg-brand"
    >
      <RSwitch.Thumb className="block size-[1.125rem] rounded-full bg-surface shadow-thumb transition-transform data-[state=checked]:translate-x-[1.125rem]" />
    </RSwitch.Root>
  );
  if (row) {
    return (
      <div className={cn("flex min-h-12 items-center justify-between gap-4 border-t border-line-soft", className)}>
        <label htmlFor={id} className="flex flex-1 cursor-pointer flex-col py-2 text-ui">
          {label}
          {description && (
            <span id={`${id}-desc`} className="text-caption text-ink-muted">
              {description}
            </span>
          )}
        </label>
        {control}
      </div>
    );
  }
  return (
    <span className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      {control}
      <label htmlFor={id} className="cursor-pointer text-md">
        {label}
      </label>
    </span>
  );
}
