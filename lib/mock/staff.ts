import type { Tone } from "@/lib/tone";
import type { IconName } from "@/lib/icons";
import type { ProfileId } from "./profiles";

export type Kpi = { value: string; label: string; tone?: "danger" | "warn" };
export type StaffRow = { time: string; title: string; sub: string; tone: Tone; status: string; action?: string; href?: string; /** Confirmation affichée après l'action (démo). */ done?: string };
export type StaffTodo = { icon: IconName; title: string; sub: string };

export type StaffDashboard = { kpis: Kpi[]; listTitle: string; list: StaffRow[]; todo: StaffTodo[] };

export const STAFF_DASHBOARDS: Partial<Record<ProfileId, StaffDashboard>> = {
  prof: {
    kpis: [
      { value: "2", label: "Appels à faire aujourd'hui", tone: "danger" },
      { value: "26", label: "Copies à évaluer · 3e A" },
      { value: "5", label: "Messages non lus" },
    ],
    listTitle: "Mes cours aujourd'hui",
    list: [
      { time: "08:00", title: "4e B · Mathématiques", sub: "Salle B12", tone: "ok", status: "Appel fait" },
      { time: "09:00", title: "3e A · Mathématiques", sub: "Salle B12", tone: "ok", status: "Appel fait" },
      { time: "10:15", title: "4e D · Mathématiques", sub: "Salle B12", tone: "danger", status: "Appel à faire", action: "Faire l'appel", href: "/appel" },
      { time: "14:30", title: "6e C · Mathématiques", sub: "Salle B14", tone: "neutral", status: "À venir" },
    ],
    todo: [
      { icon: "edit_note", title: "Évaluer le contrôle « Fractions »", sub: "3e A · avant le 16 oct." },
      { icon: "mail", title: "Message de Mme Martin", sub: "Responsable de Léa Martin, 4e B" },
      { icon: "event", title: "Conseil pédagogique", sub: "jeu. 15 oct. · 17 h 00" },
    ],
  },
  cpe: {
    kpis: [
      { value: "14", label: "Absences non justifiées", tone: "danger" },
      { value: "6", label: "Retards ce matin", tone: "warn" },
      { value: "3", label: "Appels non faits" },
    ],
    listTitle: "Appels du créneau 10 h 15",
    list: [
      { time: "10:15", title: "4e D · M. Durand", sub: "27 élèves", tone: "danger", status: "Non fait" },
      { time: "10:15", title: "3e A · Mme Petit", sub: "26 élèves · 2 absents", tone: "ok", status: "Fait" },
      { time: "10:15", title: "5e C · M. Garnier", sub: "28 élèves · 1 retard", tone: "ok", status: "Fait" },
      { time: "10:15", title: "6e B · Mrs Clarke", sub: "25 élèves", tone: "danger", status: "Non fait" },
    ],
    todo: [
      { icon: "event_busy", title: "Noah Dupuis · 3e A", sub: "Absent depuis 3 jours, famille injoignable" },
      { icon: "description", title: "5 justificatifs reçus", sub: "À valider" },
      { icon: "gavel", title: "Commission éducative", sub: "ven. 16 oct. · 14 h 00" },
    ],
  },
  direction: {
    kpis: [
      { value: "4,2 %", label: "Taux d'absentéisme · septembre" },
      { value: "18/24", label: "Conseils de classe planifiés" },
      { value: "2", label: "Incidents à traiter", tone: "danger" },
    ],
    listTitle: "Conseils de classe du trimestre",
    list: [
      { time: "30/11", title: "6e A à 6e D", sub: "Salle du conseil", tone: "ok", status: "Planifié" },
      { time: "01/12", title: "5e A à 5e D", sub: "Salle du conseil", tone: "ok", status: "Planifié" },
      { time: "02/12", title: "4e A à 4e D", sub: "Salle du conseil", tone: "warn", status: "2 profs manquants" },
      { time: "03/12", title: "3e A à 3e D", sub: "—", tone: "danger", status: "À planifier", action: "Planifier", done: "Conseils des 3e ajoutés au planning" },
    ],
    todo: [
      { icon: "report", title: "Incident · cour de récréation", sub: "Rapport de M. Colin, lun. 12 oct." },
      { icon: "article", title: "Valider le modèle de bulletin T1", sub: "Avant le 20 nov." },
      { icon: "groups", title: "Conseil d'administration", sub: "jeu. 5 nov. · 18 h 00" },
    ],
  },
  secretariat: {
    kpis: [
      { value: "12", label: "Factures impayées", tone: "danger" },
      { value: "4", label: "Inscriptions en attente", tone: "warn" },
      { value: "7", label: "Certificats demandés" },
    ],
    listTitle: "Demandes du jour",
    list: [
      { time: "08:42", title: "Certificat de scolarité", sub: "Famille Benali · 1re 3", tone: "neutral", status: "Nouveau", action: "Générer", done: "Certificat de scolarité généré" },
      { time: "09:15", title: "Changement d'adresse", sub: "Famille Morel · 5e A", tone: "warn", status: "Pièce manquante" },
      { time: "10:03", title: "Inscription en cours d'année", sub: "Famille Diallo · 6e", tone: "info", status: "Dossier complet", action: "Ouvrir", done: "Dossier de la famille Diallo ouvert" },
      { time: "11:20", title: "Remboursement cantine", sub: "Famille Roche · 4e C", tone: "ok", status: "Traité" },
    ],
    todo: [
      { icon: "payments", title: "Relancer 12 impayés de cantine", sub: "Total 486,00 €" },
      { icon: "print", title: "Imprimer les convocations au brevet blanc", sub: "3e A à 3e D" },
      { icon: "mail", title: "Circulaire photos de classe", sub: "À diffuser avant jeudi" },
    ],
  },
};
