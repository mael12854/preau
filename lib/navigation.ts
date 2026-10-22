/** Modules de l'application et menu de chaque profil. */
import type { IconName } from "@/lib/icons";

export type ModuleKey =
  | "dash" | "edt" | "devoirs" | "notes" | "viesco" | "messages"
  | "documents" | "agenda" | "paiements" | "bulletins" | "saisie" | "liaison" | "annuaire"
  | "outils" | "enligne" | "applis" | "compte";

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
  liaison: { key: "liaison", label: "Cahier de liaison", icon: "sticky_note_2", slug: "cahier-de-liaison" },
  annuaire: { key: "annuaire", label: "Annuaire", icon: "badge", slug: "annuaire" },
  outils: { key: "outils", label: "Outils", icon: "extension", slug: "outils" },
  enligne: { key: "enligne", label: "Mes classes en ligne", icon: "cast_for_education", slug: "classes-en-ligne" },
  applis: { key: "applis", label: "Mes applis", icon: "apps", slug: "applis" },
  compte: { key: "compte", label: "Mon compte", icon: "settings", slug: "compte" },
};

export type ProfileId =
  | "primaire" | "college" | "lycee" | "parent" | "parent-primaire"
  | "prof" | "enseignant-primaire" | "cpe" | "direction" | "secretariat";

/** Profils de l'école primaire : évaluations affichées avec les libellés du livret scolaire. */
export const PRIMARY_PROFILES: ProfileId[] = ["primaire", "parent-primaire", "enseignant-primaire"];

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

const ELEVE: ModuleKey[] = ["dash", "edt", "devoirs", "notes", "viesco", "messages", "documents", "agenda", "bulletins", "outils", "enligne", "applis", "compte"];

/**
 * Menu de chaque profil. Les noms et rôles ne servent que de valeurs par défaut :
 * la personne connectée est lue dans Supabase (lib/session.ts).
 */
export const PROFILES: Profile[] = [
  // École primaire : l'enfant a une interface très simple (ses devoirs et le cahier de liaison).
  { id: "primaire", label: "Élève · primaire", name: "", role: "", initials: "", hello: "", email: "", staff: false, nav: ["dash", "edt", "devoirs", "liaison", "outils", "enligne", "applis", "compte"] },
  {
    id: "parent-primaire", label: "Parent · primaire", name: "", role: "", initials: "", hello: "", email: "", staff: false,
    labels: { bulletins: "Livret scolaire", viesco: "Absences" },
    nav: ["dash", "liaison", "edt", "devoirs", "notes", "viesco", "messages", "paiements", "bulletins", "documents", "agenda", "outils", "enligne", "applis", "compte"],
  },
  {
    id: "enseignant-primaire", label: "Enseignant · primaire", name: "", role: "", initials: "", hello: "", email: "", staff: true,
    labels: { devoirs: "Cahier de textes", bulletins: "Livret scolaire" },
    nav: ["dash", "liaison", "saisie", "edt", "devoirs", "viesco", "bulletins", "messages", "documents", "agenda", "outils", "enligne", "applis", "compte"],
  },
  { id: "college", label: "Élève · collège", name: "Léa Martin", role: "4e B", initials: "LM", hello: "Bonjour Léa", email: "lea.martin@jean-moulin.preau.fr", staff: false, nav: ELEVE },
  { id: "lycee", label: "Élève · lycée", name: "Hugo Benali", role: "1re 3 · Spé. Maths, SES", initials: "HB", hello: "Bonjour Hugo", email: "hugo.benali@preau.fr", staff: false, nav: ELEVE },
  {
    id: "parent", label: "Parent", name: "Sophie Martin", role: "Responsable de Léa (4e B)", initials: "SM", hello: "Bonjour Madame Martin", email: "sophie.martin@mail.fr", staff: false,
    nav: ["dash", "notes", "devoirs", "edt", "viesco", "messages", "paiements", "bulletins", "documents", "agenda", "outils", "enligne", "applis", "compte"],
  },
  {
    id: "prof", label: "Professeur", name: "Marc Durand", role: "Mathématiques", initials: "MD", hello: "Bonjour Monsieur Durand", email: "marc.durand@ac-academie.fr", staff: true,
    labels: { devoirs: "Cahier de textes" },
    nav: ["dash", "saisie", "edt", "devoirs", "viesco", "bulletins", "messages", "documents", "agenda", "outils", "enligne", "applis", "compte"],
  },
  {
    id: "cpe", label: "Vie scolaire / CPE", name: "Nadia Kader", role: "Conseillère principale d'éducation", initials: "NK", hello: "Bonjour Madame Kader", email: "nadia.kader@ac-academie.fr", staff: true,
    nav: ["dash", "viesco", "edt", "messages", "agenda", "documents", "outils", "enligne", "applis", "compte"],
  },
  {
    id: "direction", label: "Direction", name: "Paul Lefèvre", role: "Principal", initials: "PL", hello: "Bonjour Monsieur Lefèvre", email: "principal@jean-moulin.preau.fr", staff: true,
    nav: ["dash", "edt", "bulletins", "viesco", "agenda", "messages", "documents", "annuaire", "outils", "enligne", "applis", "compte"],
  },
  {
    id: "secretariat", label: "Secrétariat", name: "Claire Roux", role: "Secrétariat de direction", initials: "CR", hello: "Bonjour Madame Roux", email: "secretariat@jean-moulin.preau.fr", staff: true,
    nav: ["dash", "edt", "viesco", "paiements", "bulletins", "documents", "messages", "agenda", "annuaire", "outils", "enligne", "applis", "compte"],
  },
];

export function moduleLabel(profile: Profile, key: ModuleKey): string {
  return profile.labels?.[key] ?? MODULES[key].label;
}

export function navCountLabel(key: ModuleKey, n: number): string {
  if (key === "messages") return `${n} messages non lus`;
  if (key === "devoirs") return `${n} devoirs à faire`;
  return String(n);
}
