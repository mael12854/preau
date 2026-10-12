/**
 * Formats d'affichage (guide de rédaction), toujours à l'heure de Paris :
 * « mar. 13 oct. » · « mardi 13 octobre 2026 » · « 8 h 30 » · « 08:30 » en grille · « 23,40 € ».
 */

const TZ = "Europe/Paris";
const SHORT_DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const LONG_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const SHORT_MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const LONG_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export type DateInput = Date | string;

/** Une date seule (« 2026-10-09 ») est lue à midi UTC pour ne jamais changer de jour. */
export function toDate(d: DateInput): Date {
  if (d instanceof Date) return d;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00Z`) : new Date(d);
}

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  weekday: "short", hourCycle: "h23",
});
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Composantes de la date à Paris. month est 0-indexé, weekday 0 = dimanche. */
export function paris(d: DateInput) {
  const p = Object.fromEntries(partsFormatter.formatToParts(toDate(d)).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year), month: Number(p.month) - 1, day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute), weekday: WEEKDAYS[p.weekday],
  };
}

/** « 2026-10-13 » à Paris. */
export function isoDay(d: DateInput): string {
  const p = paris(d);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Ajoute des jours à une date « AAAA-MM-JJ ». */
export function addDays(day: string, n: number): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lundi de la semaine d'une date « AAAA-MM-JJ ». */
export function mondayOf(day: string): string {
  const wd = paris(day).weekday;
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

/** « mar. 13 oct. » */
export function formatDateShort(d: DateInput): string {
  const p = paris(d);
  return `${SHORT_DAYS[p.weekday]} ${p.day} ${SHORT_MONTHS[p.month]}`;
}

/** « 9 oct. » */
export function formatDayMonth(d: DateInput): string {
  const p = paris(d);
  return `${p.day} ${SHORT_MONTHS[p.month]}`;
}

/** « mardi 13 octobre 2026 » (capitalize pour un début de phrase) */
export function formatDateLong(d: DateInput, capitalize = false): string {
  const p = paris(d);
  const s = `${LONG_DAYS[p.weekday]} ${p.day} ${LONG_MONTHS[p.month]} ${p.year}`;
  return capitalize ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** « Pour mercredi 14 octobre » */
export function formatDueDay(d: DateInput): string {
  const p = paris(d);
  return `Pour ${LONG_DAYS[p.weekday]} ${p.day} ${LONG_MONTHS[p.month]}`;
}

/** « Octobre 2026 » */
export function formatMonth(year: number, monthIndex: number): string {
  const m = LONG_MONTHS[monthIndex];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${year}`;
}

/** Heure décimale à Paris (10 h 15 → 10.25). */
export function hoursOf(d: DateInput): number {
  const p = paris(d);
  return p.hour + p.minute / 60;
}

function split(hours: number): [number, number] {
  const h = Math.floor(hours);
  return [h, Math.round((hours - h) * 60)];
}

/** Heure dans un texte : 8.5 → « 8 h 30 » ; accepte aussi une date. */
export function formatTimeText(t: number | DateInput): string {
  const [h, m] = split(typeof t === "number" ? t : hoursOf(t));
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** Heure dans une grille : 8.5 → « 08:30 » ; accepte aussi une date. */
export function formatTimeGrid(t: number | DateInput): string {
  const [h, m] = split(typeof t === "number" ? t : hoursOf(t));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Montant : 23.4 → « 23,40 € » (espaces insécables). */
export function formatEuro(amount: number): string {
  const [int, dec] = amount.toFixed(2).split(".");
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} €`;
}

/** Montant en centimes : 2340 → « 23,40 € ». */
export const formatCents = (cents: number) => formatEuro(cents / 100);

/** Taille de fichier : « 84 Ko », « 1,2 Mo ». */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/** Date relative : « il y a 5 min », « il y a 2 h », « hier », « lun. 12 oct. », « 1 sept. ». */
export function formatRelative(d: DateInput, reference: Date): string {
  const date = toDate(d);
  const diffMin = Math.round((reference.getTime() - date.getTime()) / 60000);
  const today = isoDay(reference);
  const day = isoDay(date);
  if (day === today) {
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    return `il y a ${Math.floor(diffMin / 60)} h`;
  }
  if (day === addDays(today, -1)) return "hier";
  if (day > addDays(today, -7)) return formatDateShort(date);
  return formatDayMonth(date);
}

/** « jeudi 1er octobre » */
export function formatDayLong(d: DateInput): string {
  const p = paris(d);
  return `${LONG_DAYS[p.weekday]} ${p.day === 1 ? "1er" : p.day} ${LONG_MONTHS[p.month]}`;
}

/** « mardi » */
export function formatWeekday(d: DateInput): string {
  return LONG_DAYS[paris(d).weekday];
}
