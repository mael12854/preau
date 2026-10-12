/**
 * Formats d'affichage (guide de rédaction) :
 * « mar. 13 oct. » · « mardi 13 octobre 2026 » · « 8 h 30 » · « 08:30 » en grille · « 23,40 € ».
 */

const SHORT_DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const LONG_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const SHORT_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const LONG_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « mar. 13 oct. » */
export function formatDateShort(date: Date): string {
  return `${SHORT_DAYS[date.getDay()]} ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

/** « mardi 13 octobre 2026 » (capitalize pour un début de phrase) */
export function formatDateLong(date: Date, capitalize = false): string {
  const s = `${LONG_DAYS[date.getDay()]} ${date.getDate()} ${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return capitalize ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** « Octobre 2026 » */
export function formatMonth(year: number, monthIndex: number): string {
  const m = LONG_MONTHS[monthIndex];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${year}`;
}

function split(hours: number): [number, number] {
  const h = Math.floor(hours);
  return [h, Math.round((hours - h) * 60)];
}

/** Heure dans un texte : 8.5 → « 8 h 30 », 10 → « 10 h 00 » */
export function formatTimeText(hours: number): string {
  const [h, m] = split(hours);
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** Heure dans une grille : 8.5 → « 08:30 » */
export function formatTimeGrid(hours: number): string {
  const [h, m] = split(hours);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Montant : 23.4 → « 23,40 € » (espaces insécables) */
export function formatEuro(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}
