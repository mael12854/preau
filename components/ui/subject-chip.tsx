import { cn } from "@/lib/cn";
import { subjectStyle } from "@/lib/subjects";

type SubjectChipProps = {
  name: string;
  hue: number;
  /** Affiche la pastille de couleur de la matière (8 px). */
  dot?: boolean;
  className?: string;
};

/** Étiquette matière : fond oklch(0.95 0.035 h), texte oklch(0.38 0.09 h), rayon 999. */
export function SubjectChip({ name, hue, dot, className }: SubjectChipProps) {
  return (
    <span
      className={cn(
        "subject inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-subject-tint text-meta font-bold text-subject-ink",
        dot ? "py-[0.3125rem] pr-3 pl-2" : "px-2.5 py-[0.1875rem]",
        className,
      )}
      style={subjectStyle(hue)}
    >
      {dot && <span aria-hidden="true" className="size-2 rounded-full bg-subject-dot" />}
      {name}
    </span>
  );
}

/** Pastille de couleur de matière seule (décorative : le nom est toujours affiché à côté). */
export function SubjectDot({ hue, size = 10, className }: { hue: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("subject shrink-0 rounded-full bg-subject-dot", className)}
      style={{ ...subjectStyle(hue), width: size, height: size }}
    />
  );
}
