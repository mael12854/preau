import type { Tone } from "@/lib/tone";

export type AgendaEvent = { title: string; tone: Tone };

export const AGENDA_MONTH = { year: 2026, month: 9 /* octobre */ };

/** Événements d'octobre 2026, par jour du mois. */
export const AGENDA_EVENTS: Record<number, AgendaEvent[]> = {
  2: [{ title: "Photo de classe", tone: "info" }],
  8: [{ title: "Cross du collège", tone: "ok" }],
  13: [{ title: "Réunion parents-profs · 17 h 30", tone: "brand" }],
  15: [{ title: "Conseil pédagogique", tone: "neutral" }],
  16: [{ title: "Sortie Futuroscope", tone: "warn" }],
  19: [{ title: "Vacances de la Toussaint", tone: "neutral" }],
};

/** Vacances de la Toussaint à partir du samedi 17 octobre. */
export const HOLIDAYS_FROM = 17;
