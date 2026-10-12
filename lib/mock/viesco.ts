import type { Tone } from "@/lib/tone";
import type { IconName } from "@/lib/icons";

export type SchoolLifeEvent = {
  icon: IconName;
  type: string;
  date: string;
  detail: string;
  tone: Tone;
  status: string;
  statusTone: Tone;
  /** L'événement peut être justifié par la famille. */
  canJustify?: boolean;
};

export const SCHOOL_LIFE_EVENTS: SchoolLifeEvent[] = [
  { icon: "event_busy", type: "Absence", date: "jeu. 1 oct. · journée", detail: "Motif non renseigné", tone: "danger", status: "À justifier", statusTone: "danger", canJustify: true },
  { icon: "schedule", type: "Retard", date: "lun. 12 oct. · 8 h 12", detail: "Mathématiques · 12 min", tone: "warn", status: "Justifié", statusTone: "ok" },
  { icon: "schedule", type: "Retard", date: "lun. 28 sept. · 13 h 42", detail: "EPS · 12 min · transport scolaire", tone: "warn", status: "Justifié", statusTone: "ok" },
  { icon: "backpack", type: "Oubli de matériel", date: "mer. 23 sept.", detail: "Arts plastiques · carnet de croquis", tone: "neutral", status: "Noté", statusTone: "neutral" },
  { icon: "thumb_up", type: "Encouragement", date: "ven. 9 oct.", detail: "Mme Petit · participation remarquable", tone: "ok", status: "Encouragement", statusTone: "ok" },
];

export const SCHOOL_LIFE_STATS: { value: string; label: string; positive?: boolean }[] = [
  { value: "1", label: "Absence · 1 à justifier" },
  { value: "2", label: "Retards · 24 min au total" },
  { value: "0", label: "Sanction" },
  { value: "1", label: "Encouragement", positive: true },
];

export const ABSENCE_REASONS = [
  { value: "maladie", label: "Maladie" },
  { value: "rdv-medical", label: "Rendez-vous médical" },
  { value: "famille", label: "Raison familiale" },
  { value: "transport", label: "Problème de transport" },
  { value: "autre", label: "Autre motif" },
];
