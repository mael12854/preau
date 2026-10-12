/** Listes de référence de l'interface. */

export type Attendance = "present" | "absent" | "late";

export const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: "present", label: "Présent" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Retard" },
];

export const ABSENCE_REASONS = [
  { value: "maladie", label: "Maladie" },
  { value: "rdv-medical", label: "Rendez-vous médical" },
  { value: "famille", label: "Raison familiale" },
  { value: "transport", label: "Problème de transport" },
  { value: "autre", label: "Autre motif" },
];
