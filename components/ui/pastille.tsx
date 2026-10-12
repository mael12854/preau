import { cn } from "@/lib/cn";
import { EVAL_META, type EvalValue } from "@/lib/evaluation";

/** Tailles : 16 (liste) · 20 (saisie) · 24 (tableau) · 28 (détail). */
export type PastilleSize = 14 | 16 | 20 | 24 | 28;

type DotProps = {
  value: EvalValue;
  size?: PastilleSize;
  className?: string;
};

/**
 * Le disque coloré seul, toujours masqué aux technologies d'assistance.
 * À n'utiliser que lorsque le libellé du niveau est affiché à côté, dans le même élément :
 * sinon, utilisez <Pastille>.
 */
export function PastilleDot({ value, size = 16, className }: DotProps) {
  const meta = EVAL_META[value];
  const empty = meta.color === null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pastille-dot inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none",
        empty ? "border-2 border-eval-ne text-ink-muted" : "text-on-eval",
        className,
      )}
      style={{
        width: `${size / 16}rem`,
        height: `${size / 16}rem`,
        background: meta.color ?? "transparent",
        fontSize: `${Math.max(size * 0.36, 6) / 16}rem`,
      }}
    >
      {size >= 16 && <span className="pastille-sigle">{empty ? "" : meta.short}</span>}
    </span>
  );
}

type PastilleProps = DotProps & {
  /** Libellé affiché : complet (« Maîtrise fragile »), légende (« Fragile ») ou sigle (« MF »). */
  display?: "label" | "legend" | "short";
  /** Contexte ajouté à l'aria-label, ex. « Contrôle — Fractions, 9 oct. ». */
  context?: string;
  className?: string;
  labelClassName?: string;
};

/**
 * Pastille d'évaluation : jamais seule, son libellé est toujours affiché à côté
 * et repris dans l'aria-label.
 */
export function Pastille({ value, size = 16, display = "label", context, className, labelClassName }: PastilleProps) {
  const meta = EVAL_META[value];
  const text = display === "label" ? meta.label : display === "legend" ? meta.legend : meta.short;
  return (
    <span
      role="img"
      aria-label={context ? `${context} : ${meta.label}` : meta.label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <PastilleDot value={value} size={size} />
      <span className={cn("text-label", labelClassName)}>{text}</span>
    </span>
  );
}

/** Légende des 4 niveaux, ordre fixe MI → TB. */
export function PastilleLegend({ className, size = 12 }: { className?: string; size?: number }) {
  return (
    <ul className={cn("m-0 flex list-none flex-wrap gap-x-3.5 gap-y-2 p-0 text-caption text-ink-2", className)} aria-label="Légende des niveaux de maîtrise">
      {(["MI", "MF", "MS", "TB"] as const).map((v) => (
        <li key={v} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="pastille-dot shrink-0 rounded-full" style={{ width: size, height: size, background: EVAL_META[v].color ?? undefined }} />
          <span>
            {EVAL_META[v].legend}
            <span className="sr-only"> ({EVAL_META[v].label})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Barre de répartition empilée, ordre fixe MI → TB, segments séparés de 2 px. */
export function DistributionBar({
  counts,
  height = 10,
  className,
}: {
  counts: { level: "MI" | "MF" | "MS" | "TB"; count: number }[];
  height?: number;
  className?: string;
}) {
  const parts = counts.filter((c) => c.count > 0);
  const summary = parts.map((c) => `${c.count} ${EVAL_META[c.level].label.toLowerCase()}`).join(", ");
  return (
    <div role="img" aria-label={`Répartition : ${summary || "aucune évaluation"}`} className={cn("flex gap-0.5", className)} style={{ height }}>
      {parts.map((c) => (
        <div key={c.level} className="rounded-[3px]" style={{ flex: c.count, background: EVAL_META[c.level].color ?? undefined }} />
      ))}
    </div>
  );
}
