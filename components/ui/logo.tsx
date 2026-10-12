import { cn } from "@/lib/cn";

type LogoMarkProps = {
  /** Côté du carré en px. Favicon ≥ 16 px, logo complet ≥ 80 px. */
  size?: number;
  /** Inversé : carré Craie + arche Tableau (sur fond foncé). */
  inverse?: boolean;
  className?: string;
};

/**
 * Symbole Préau : carré Tableau (rayon 25 %) et arche Craie.
 * Arche : gauche/droite 25 %, haut 40,8 %, bas 21,7 %, épaisseur ≈ 8,3 %.
 */
export function LogoMark({ size = 32, inverse, className }: LogoMarkProps) {
  const square = inverse ? "var(--sidebar-ink)" : "#1F5546";
  const arch = inverse ? "var(--sidebar)" : "#F5F3EC";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" rx="25" fill={square} />
      <path d="M29.15 78.3V65.8a20.85 20.85 0 0 1 41.7 0v12.5" fill="none" stroke={arch} strokeWidth="8.3" />
    </svg>
  );
}

type LogoProps = LogoMarkProps & {
  /** Taille du logotype en px. */
  wordmarkSize?: number;
};

/** Logo complet : symbole + logotype « préau » (minuscules, Schibsted 800, −3 %). */
export function Logo({ size = 30, wordmarkSize = 20, inverse, className }: LogoProps) {
  return (
    <span role="img" aria-label="Préau" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} inverse={inverse} />
      <span
        aria-hidden="true"
        className="font-display font-extrabold tracking-[-0.03em]"
        style={{ fontSize: `${wordmarkSize / 16}rem`, lineHeight: 1 }}
      >
        préau
      </span>
    </span>
  );
}
