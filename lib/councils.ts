/** Conseils de classe : étapes, mentions et rôles (partagés entre serveur et écrans). */
export type CouncilStatus = "preparation" | "en_cours" | "cloture";
export const MENTIONS = [
  "Félicitations",
  "Compliments",
  "Encouragements",
  "Avertissement travail",
  "Avertissement assiduité",
  "Avertissement comportement",
] as const;
export const COUNCIL_ROLES = {
  prof: "Professeur",
  prof_principal: "Professeur principal",
  direction: "Direction",
  vie_scolaire: "Vie scolaire",
  delegue_eleve: "Délégué élève",
  delegue_parent: "Délégué parent",
} as const;
export type CouncilRole = keyof typeof COUNCIL_ROLES;

/** Rôles qu'on peut donner selon le profil de la personne (le professeur principal se choisit à la création du conseil). */
export const ROLES_BY_KIND: Record<string, CouncilRole[]> = {
  eleve: ["delegue_eleve"],
  parent: ["delegue_parent"],
  prof: ["prof"],
  direction: ["direction"],
  cpe: ["vie_scolaire"],
  secretariat: ["vie_scolaire"],
};

