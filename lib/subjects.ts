import type { CSSProperties } from "react";

/**
 * Couleurs de matière, dérivées d'une seule teinte OKLCH.
 * Pastille oklch(0.6 0.13 h) · fond oklch(0.95 0.035 h) · texte oklch(0.38 0.09 h)
 * Texte en mode sombre oklch(0.8 0.1 h).
 */
export type SubjectColor = {
  dot: string;
  tint: string;
  ink: string;
  inkDark: string;
  tintDark: string;
};

export function subjectColor(hue: number): SubjectColor {
  return {
    dot: `oklch(0.6 0.13 ${hue})`,
    tint: `oklch(0.95 0.035 ${hue})`,
    ink: `oklch(0.38 0.09 ${hue})`,
    inkDark: `oklch(0.8 0.1 ${hue})`,
    tintDark: `oklch(0.3 0.045 ${hue})`,
  };
}

/**
 * Variables CSS à poser sur un élément portant la classe `subject` :
 * elles suivent le thème (clair / sombre) via globals.css.
 * Utilitaires disponibles : bg-subject-dot, bg-subject-tint, text-subject-ink.
 */
export function subjectStyle(hue: number): CSSProperties {
  return { "--subject-h": hue } as CSSProperties;
}

/** Teintes de référence (README). */
export const SUBJECT_HUES = {
  arts: 0,
  francais: 30,
  histoireGeo: 60,
  sesPhilo: 90,
  eps: 120,
  svt: 150,
  physiqueChimie: 180,
  techno: 210,
  maths: 240,
  lv2: 270,
  anglais: 300,
  musique: 330,
} as const;
