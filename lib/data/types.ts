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

export type HomeworkDayView = { day: string; dueOn: string; items: HomeworkView[] };

export type EvaluationView = {
  id: string;
  title: string;
  date: string;
  level: EvalValue;
  skills: { name: string; level: EvalValue }[];
  comment: string | null;
  term: number;
};

export type SubjectEvaluationsView = { subject: SubjectRef; prof: string; evaluations: EvaluationView[] };

export type LastEvaluationView = { id: string; title: string; subject: string; date: string; level: EvalValue };

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
  student?: string;
};

export type LifeStatsView = { absences: number; toJustify: number; lates: number; lateMinutes: number; sanctions: number; encouragements: number };

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
};

export type AgendaEventView = { title: string; tone: Tone; startsOn: string; endsOn: string | null; holiday: boolean };

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
  lines: { subject: SubjectRef; level: EvalLevel; comment: string }[];
  council: { title: string; text: string } | null;
};

export type StudentRow = { id: string; name: string; initials: string };
