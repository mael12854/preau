/**
 * Horloge de l'application. Les données de démonstration couvrent la semaine du 12 octobre 2026 :
 * PREAU_NOW fige « maintenant » (par défaut mardi 13 octobre 2026, 10 h 30). PREAU_NOW=real : heure réelle.
 */
const DEFAULT_NOW = "2026-10-13T10:30:00+02:00";

export function now(): Date {
  const v = process.env.PREAU_NOW ?? DEFAULT_NOW;
  return v === "real" ? new Date() : new Date(v);
}
