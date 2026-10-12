import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = {
  as?: T;
  /** Padding intérieur : 20 par défaut, `none` pour les tableaux. */
  padding?: "none" | "md" | "lg";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** Carte : fond surface, bordure --line, rayon 14, aucune ombre. */
export function Card<T extends ElementType = "section">({ as, padding = "md", className, children, ...props }: CardProps<T>) {
  const Tag = (as ?? "section") as ElementType;
  return (
    <Tag
      className={cn(
        "rounded-card border border-line bg-surface",
        padding === "md" && "p-5",
        padding === "lg" && "p-[1.375rem]",
        padding === "none" && "overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Titre de carte (h2) avec action optionnelle à droite. */
export function CardHeader({
  title,
  action,
  as: H = "h2",
  className,
  size = "card",
}: {
  title: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
  size?: "card" | "h3";
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <H className={cn("m-0 font-display font-bold", size === "card" ? "text-card" : "text-h3")}>{title}</H>
      {action}
    </div>
  );
}
