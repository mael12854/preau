import type { EvalLevel, EvalValue } from "@/lib/evaluation";
import type { IconName } from "@/lib/icons";
import type { Tone } from "@/lib/tone";

/** Types d'affichage partagés entre les chargeurs de données et les écrans. */

export type SubjectRef = { id: string; name: string; hue: number };

export type LessonView = {
  id: string;
  subject: SubjectRef;
  room: string;
  teacher: string;
  className?: string;
  start: number; // heure décimale à Paris
  end: number;
  day: number; // 0 = lundi
  cancelled: boolean;
  now: boolean;
  /** Série hebdomadaire d'origine (nul : cours ponctuel). */
  seriesId: string | null;
  teacherId: string;
  /** Demi-groupe ou option (G1, Espagnol…) ; nul : classe entière. */
  groupId: string | null;
  group: string | null;
};

export type HomeworkView = {
  id: string;
  subject: SubjectRef;
  text: string;
  given: string;
  dueOn: string;
  exam: boolean;
  file: string | null;
  className?: string;
};

export type HomeworkDayView = {
  day: string;
  dueOn: string;
  items: HomeworkView[];
};

export type EvaluationView = {
  id: string;
  title: string;
  date: string;
  level: EvalValue;
  /** Note sur 20 (établissements notés sur 20 uniquement). */
  score: number | null;
  skills: { name: string; level: EvalValue }[];
  comment: string | null;
  term: number;
};

export type SubjectEvaluationsView = {
  subject: SubjectRef;
  prof: string;
  evaluations: EvaluationView[];
};

export type LastEvaluationView = {
  id: string;
  title: string;
  subject: string;
  date: string;
  level: EvalValue;
  score: number | null;
};

export type LifeEventView = {
  id: string;
  icon: IconName;
  type: string;
  date: string;
  detail: string;
  tone: Tone;
  status: string;
  statusTone: Tone;
  canJustify: boolean;
  /** Justificatif envoyé par la famille, à accepter ou refuser (vie scolaire, direction, secrétariat). */
  canReview: boolean;
  student?: string;
  className?: string;
  /** Motif et commentaire de la justification, réponse de l'établissement en cas de refus. */
  reason?: string;
  comment?: string;
  reviewComment?: string;
  /** « à traiter » : à justifier ou justificatif en attente. */
  pending: boolean;
  kind: string;
};

export type LifeStatsView = {
  absences: number;
  toJustify: number;
  lates: number;
  lateMinutes: number;
  sanctions: number;
  encouragements: number;
};

export type MessageView = {
  id: string;
  initials: string;
  from: string;
  fromId: string;
  role: string;
  subject: string;
  date: string;
  body: string;
  unread: boolean;
  /** Envoi programmé, pas encore parti (Envoyés). */
  scheduled?: boolean;
};

export type DocumentView = {
  id: string;
  icon: IconName;
  name: string;
  category: "Administratif" | "Pédagogique" | "Cantine";
  date: string;
  size: string;
  toSign: boolean;
  signed: boolean;
  /** Un fichier est stocké : le bouton de téléchargement est actif. */
  downloadable: boolean;
  /** L'auteur, la direction ou le secrétariat peuvent retirer le document. */
  canDelete: boolean;
};

export type AgendaEventView = {
  id: string;
  title: string;
  tone: Tone;
  startsOn: string;
  endsOn: string | null;
  holiday: boolean;
  /** Classe concernée (nul : tout l'établissement). */
  className: string | null;
  /** L'auteur, la direction ou le secrétariat peuvent le retirer. */
  canDelete: boolean;
};

export type BillView = {
  id: string;
  label: string;
  date: string;
  amount: string;
  status: string;
  tone: Tone;
  payable: boolean;
  student?: string;
  /** Paiement lancé, en attente de confirmation du prestataire. */
  pendingPaymentId?: string;
};

export type PendingTopUpView = { id: string; amount: string; date: string };

export type ReportPeriodView = {
  id: string;
  title: string;
  detail: string;
  available: boolean;
  reportTitle: string;
  student: string;
  className: string;
  headTeacher: string | null;
  lines: { subject: SubjectRef; level: EvalLevel | null; comment: string; score: number | null }[];
  council: { title: string; text: string } | null;
};

export type StudentRow = { id: string; name: string; initials: string };
