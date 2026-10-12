import type { IconName } from "@/lib/icons";

export type ModuleKey =
  | "dash" | "edt" | "devoirs" | "notes" | "viesco" | "messages"
  | "documents" | "agenda" | "paiements" | "bulletins" | "saisie" | "compte";

export type Module = { key: ModuleKey; label: string; icon: IconName; slug: string };

export const MODULES: Record<ModuleKey, Module> = {
  dash: { key: "dash", label: "Tableau de bord", icon: "space_dashboard", slug: "accueil" },
  edt: { key: "edt", label: "Emploi du temps", icon: "calendar_view_week", slug: "emploi-du-temps" },
  devoirs: { key: "devoirs", label: "Devoirs", icon: "menu_book", slug: "devoirs" },
  notes: { key: "notes", label: "Évaluations", icon: "donut_large", slug: "evaluations" },
  viesco: { key: "viesco", label: "Vie scolaire", icon: "how_to_reg", slug: "vie-scolaire" },
  messages: { key: "messages", label: "Messagerie", icon: "mail", slug: "messagerie" },
  documents: { key: "documents", label: "Documents", icon: "folder", slug: "documents" },
  agenda: { key: "agenda", label: "Agenda", icon: "event", slug: "agenda" },
  paiements: { key: "paiements", label: "Paiements & cantine", icon: "payments", slug: "paiements" },
  bulletins: { key: "bulletins", label: "Bulletins", icon: "article", slug: "bulletins" },
  saisie: { key: "saisie", label: "Appel & évaluation", icon: "fact_check", slug: "appel" },
  compte: { key: "compte", label: "Mon compte", icon: "settings", slug: "compte" },
};

export type ProfileId = "college" | "lycee" | "parent" | "prof" | "cpe" | "direction" | "secretariat";

export type Profile = {
  id: ProfileId;
  /** Libellé du profil dans le sélecteur de démonstration. */
  label: string;
  name: string;
  role: string;
  initials: string;
  /** Salutation : prénom pour les élèves, civilité + nom pour les adultes. */
  hello: string;
  email: string;
  staff: boolean;
  /** Modules visibles, dans l'ordre de la navigation. */
  nav: ModuleKey[];
  /** Libellés propres au profil (le professeur voit « Cahier de textes »). */
  labels?: Partial<Record<ModuleKey, string>>;
};

const ELEVE: ModuleKey[] = ["dash", "edt", "devoirs", "notes", "viesco", "messages", "documents", "agenda", "bulletins", "compte"];

export const PROFILES: Profile[] = [
  { id: "college", label: "Élève · collège", name: "Léa Martin", role: "4e B", initials: "LM", hello: "Bonjour Léa", email: "lea.martin@jean-moulin.preau.fr", staff: false, nav: ELEVE },
  { id: "lycee", label: "Élève · lycée", name: "Hugo Benali", role: "1re 3 · Spé. Maths, SES", initials: "HB", hello: "Bonjour Hugo", email: "hugo.benali@preau.fr", staff: false, nav: ELEVE },
  {
    id: "parent", label: "Parent", name: "Sophie Martin", role: "Responsable de Léa (4e B)", initials: "SM", hello: "Bonjour Madame Martin", email: "sophie.martin@mail.fr", staff: false,
    nav: ["dash", "notes", "devoirs", "edt", "viesco", "messages", "paiements", "bulletins", "documents", "agenda", "compte"],
  },
  {
    id: "prof", label: "Professeur", name: "Marc Durand", role: "Mathématiques", initials: "MD", hello: "Bonjour Monsieur Durand", email: "marc.durand@ac-academie.fr", staff: true,
    labels: { devoirs: "Cahier de textes" },
    nav: ["dash", "saisie", "edt", "devoirs", "messages", "documents", "agenda", "compte"],
  },
  {
    id: "cpe", label: "Vie scolaire / CPE", name: "Nadia Kader", role: "Conseillère principale d'éducation", initials: "NK", hello: "Bonjour Madame Kader", email: "nadia.kader@ac-academie.fr", staff: true,
    nav: ["dash", "viesco", "edt", "messages", "agenda", "documents", "compte"],
  },
  {
    id: "direction", label: "Direction", name: "Paul Lefèvre", role: "Principal", initials: "PL", hello: "Bonjour Monsieur Lefèvre", email: "principal@jean-moulin.preau.fr", staff: true,
    nav: ["dash", "bulletins", "viesco", "agenda", "messages", "documents", "compte"],
  },
  {
    id: "secretariat", label: "Secrétariat", name: "Claire Roux", role: "Secrétariat de direction", initials: "CR", hello: "Bonjour Madame Roux", email: "secretariat@jean-moulin.preau.fr", staff: true,
    nav: ["dash", "paiements", "documents", "messages", "agenda", "compte"],
  },
];

export const DEFAULT_PROFILE: ProfileId = "college";

export function getProfileById(id: string | undefined): Profile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[0];
}

export function moduleLabel(profile: Profile, key: ModuleKey): string {
  return profile.labels?.[key] ?? MODULES[key].label;
}

/** Compteurs de la navigation (non lus, à faire). */
export function navCount(profile: Profile, key: ModuleKey): number {
  if (key === "messages") return 3;
  if (key === "devoirs" && !profile.staff) return 4;
  return 0;
}

export function navCountLabel(key: ModuleKey, n: number): string {
  if (key === "messages") return `${n} messages non lus`;
  if (key === "devoirs") return `${n} devoirs à faire`;
  return String(n);
}
