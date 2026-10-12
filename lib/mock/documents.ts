import type { IconName } from "@/lib/icons";

export type DocCategory = "Administratif" | "Pédagogique" | "Cantine";

export type SchoolDocument = {
  icon: IconName;
  name: string;
  category: DocCategory;
  date: string;
  size: string;
  toSign?: boolean;
};

export const DOCUMENTS: SchoolDocument[] = [
  { icon: "draw", name: "Autorisation — Sortie théâtre", category: "Administratif", date: "12 oct.", size: "84 Ko", toSign: true },
  { icon: "description", name: "Corrigé — Contrôle fractions", category: "Pédagogique", date: "12 oct.", size: "210 Ko" },
  { icon: "restaurant", name: "Menus d'octobre", category: "Cantine", date: "1 oct.", size: "1,2 Mo" },
  { icon: "description", name: "Fiche méthode — Le croquis", category: "Pédagogique", date: "28 sept.", size: "340 Ko" },
  { icon: "badge", name: "Certificat de scolarité 2026–2027", category: "Administratif", date: "3 sept.", size: "62 Ko" },
  { icon: "gavel", name: "Règlement intérieur", category: "Administratif", date: "1 sept.", size: "480 Ko" },
];
