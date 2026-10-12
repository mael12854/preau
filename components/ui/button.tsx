import { Slot } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border-[1.5px] border-line-strong bg-surface text-ink hover:border-brand",
  tertiary: "bg-transparent text-brand hover:bg-brand-tint",
  danger: "bg-danger text-on-danger hover:brightness-95",
};

/** Hauteurs 36 (compact) · 44 (défaut, cible minimale) · 52. */
const SIZES: Record<ButtonSize, string> = {
  // Compact : 36 px visibles, zone cliquable étendue à 44 px par le pseudo-élément.
  sm: "h-9 px-3.5 text-sm rounded-[9px] after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
  md: "h-11 px-[1.125rem] text-md rounded-control",
  lg: "h-13 px-6 text-body rounded-control",
};

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Rend l'enfant (ex. <Link>) avec le style de bouton. */
  asChild?: boolean;
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "relative inline-flex shrink-0 items-center justify-center gap-2 font-bold whitespace-nowrap no-underline transition-colors",
    "disabled:bg-line disabled:text-ink-muted disabled:border-transparent disabled:cursor-not-allowed disabled:hover:bg-line",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({ variant = "primary", size = "md", icon, asChild, className, children, type, ...props }: ButtonProps) {
  const classes = buttonClasses(variant, size, className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button type={type ?? "button"} className={classes} {...props}>
      {icon && <Icon name={icon} size={size === "sm" ? 18 : 20} />}
      {children}
    </button>
  );
}
