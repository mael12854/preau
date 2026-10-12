/**
 * Horloge de l'application : l'heure réelle.
 * PREAU_NOW permet de figer « maintenant » (ex. 2026-10-13T10:30:00+02:00) pour des essais.
 */
export function now(): Date {
  const v = process.env.PREAU_NOW;
  return !v || v === "real" ? new Date() : new Date(v);
}
