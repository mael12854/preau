import type { EvalLevel } from "@/lib/evaluation";
import type { SubjectKey } from "./subjects";

export type ReportPeriod = { id: string; title: string; detail: string; available: boolean };

export const REPORT_PERIODS: ReportPeriod[] = [
  { id: "t1-2026", title: "Trimestre 1 · 2026–2027", detail: "Publication le 11 déc.", available: false },
  { id: "t3-2025", title: "Trimestre 3 · 2025–2026", detail: "5e B · publié le 2 juil.", available: true },
  { id: "t2-2025", title: "Trimestre 2 · 2025–2026", detail: "5e B · publié le 3 avr.", available: true },
];

export const DEFAULT_PERIOD = "t3-2025";

export type ReportLine = { subject: SubjectKey; level: EvalLevel; comment: string };

export const REPORT = {
  title: "Bulletin du 3e trimestre",
  student: "Léa Martin · 5e B · Professeure principale : Mme Petit",
  lines: [
    { subject: "fr", level: "MS", comment: "Lectrice attentive, expression écrite en net progrès." },
    { subject: "ma", level: "TB", comment: "Excellent trimestre, raisonnement rigoureux." },
    { subject: "hg", level: "MS", comment: "Bon investissement, connaissances à consolider." },
    { subject: "en", level: "TB", comment: "Très bon oral, participation constante." },
    { subject: "svt", level: "MF", comment: "Démarche expérimentale à travailler." },
    { subject: "eps", level: "MS", comment: "Engagée et volontaire." },
  ] satisfies ReportLine[],
  council: { title: "Félicitations du conseil de classe.", text: "Année très solide, curiosité et sérieux constants." },
};
