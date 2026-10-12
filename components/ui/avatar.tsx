import { cn } from "@/lib/cn";

/** Initiales sur fond Tableau clair. Décoratif : le nom est toujours affiché à côté. */
export function Avatar({ initials, size = 36, className }: { initials: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-bold text-brand", className)}
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem`, fontSize: `${Math.round(size * 0.35) / 16}rem` }}
    >
      {initials}
    </span>
  );
}
