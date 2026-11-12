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

