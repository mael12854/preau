import type { Level } from "./core";

/** Chapitres du programme (collège et seconde), dans l'ordre de progression habituel. */
export type Chapter = { id: string; level: Level; title: string };

export const CHAPTERS: Chapter[] = [
  // CP
  { id: "cp-nombres", level: "CP", title: "Nombres jusqu'à 100" },
  { id: "cp-additions", level: "CP", title: "Additions et soustractions" },
  { id: "cp-problemes", level: "CP", title: "Petits problèmes" },
  // CE1
  { id: "ce1-nombres", level: "CE1", title: "Nombres jusqu'à 1 000" },
  { id: "ce1-calcul", level: "CE1", title: "Calcul posé et mental" },
  { id: "ce1-tables", level: "CE1", title: "Tables de multiplication (2, 3, 4, 5, 10)" },
  { id: "ce1-mesures", level: "CE1", title: "Monnaie, longueurs, heures" },
  // CE2
  { id: "ce2-nombres", level: "CE2", title: "Nombres jusqu'à 10 000" },
  { id: "ce2-tables", level: "CE2", title: "Toutes les tables de multiplication" },
  { id: "ce2-calcul", level: "CE2", title: "Multiplication posée, partages" },
  { id: "ce2-mesures", level: "CE2", title: "Mesures : longueurs, masses, durées" },
  { id: "ce2-problemes", level: "CE2", title: "Problèmes" },
  // CM1
  { id: "cm1-nombres", level: "CM1", title: "Grands nombres" },
  { id: "cm1-fractions", level: "CM1", title: "Fractions simples" },
  { id: "cm1-decimaux", level: "CM1", title: "Nombres décimaux" },
  { id: "cm1-calcul", level: "CM1", title: "Multiplication et division" },
  { id: "cm1-mesures", level: "CM1", title: "Mesures et périmètres" },
  // CM2
  { id: "cm2-decimaux", level: "CM2", title: "Décimaux : opérations" },
  { id: "cm2-fractions", level: "CM2", title: "Fractions et décimaux" },
  { id: "cm2-division", level: "CM2", title: "Division" },
  { id: "cm2-proportionnalite", level: "CM2", title: "Proportionnalité" },
  { id: "cm2-mesures", level: "CM2", title: "Aires, conversions, durées" },
  // 6e
  { id: "6-entiers", level: "6e", title: "Nombres entiers et décimaux" },
  { id: "6-operations", level: "6e", title: "Addition, soustraction, multiplication" },
  { id: "6-division", level: "6e", title: "Division euclidienne et décimale" },
  { id: "6-fractions", level: "6e", title: "Fractions" },
  { id: "6-proportionnalite", level: "6e", title: "Proportionnalité et pourcentages" },
  { id: "6-grandeurs", level: "6e", title: "Longueurs, masses, durées : conversions" },
  { id: "6-perimetres-aires", level: "6e", title: "Périmètres et aires" },
  { id: "6-angles", level: "6e", title: "Angles" },
  { id: "6-volumes", level: "6e", title: "Volumes du pavé droit" },
  // 5e
  { id: "5-priorites", level: "5e", title: "Priorités opératoires" },
  { id: "5-relatifs", level: "5e", title: "Nombres relatifs : addition et soustraction" },
  { id: "5-fractions", level: "5e", title: "Fractions : comparer, additionner" },
  { id: "5-litteral", level: "5e", title: "Calcul littéral : tester, substituer" },
  { id: "5-proportionnalite", level: "5e", title: "Proportionnalité, échelles, pourcentages" },
  { id: "5-triangles", level: "5e", title: "Triangles et angles" },
  { id: "5-aires", level: "5e", title: "Aires : triangle, parallélogramme, disque" },
  { id: "5-statistiques", level: "5e", title: "Statistiques : moyenne, effectifs" },
  { id: "5-probabilites", level: "5e", title: "Probabilités (vocabulaire, calculs simples)" },
  // 4e
  { id: "4-relatifs", level: "4e", title: "Relatifs : multiplication et division" },
  { id: "4-fractions", level: "4e", title: "Fractions : produits et quotients" },
  { id: "4-puissances", level: "4e", title: "Puissances" },
  { id: "4-litteral", level: "4e", title: "Développer, réduire" },
  { id: "4-equations", level: "4e", title: "Équations du premier degré" },
  { id: "4-pythagore", level: "4e", title: "Théorème de Pythagore" },
  { id: "4-proportionnalite", level: "4e", title: "Proportionnalité, vitesses" },
  { id: "4-statistiques", level: "4e", title: "Statistiques : médiane, étendue" },
  { id: "4-volumes", level: "4e", title: "Volumes : prisme, cylindre, pyramide, cône" },
  // 3e
  { id: "3-arithmetique", level: "3e", title: "Arithmétique : diviseurs, nombres premiers" },
  { id: "3-litteral", level: "3e", title: "Double distributivité, identités remarquables" },
  { id: "3-factoriser", level: "3e", title: "Factoriser" },
  { id: "3-equations", level: "3e", title: "Équations produit, inéquations" },
  { id: "3-fonctions", level: "3e", title: "Fonctions, fonctions affines" },
  { id: "3-thales", level: "3e", title: "Théorème de Thalès" },
  { id: "3-trigo", level: "3e", title: "Trigonométrie" },
  { id: "3-racines", level: "3e", title: "Racines carrées, notation scientifique" },
  { id: "3-probabilites", level: "3e", title: "Probabilités" },
  { id: "3-sphere", level: "3e", title: "Sphère, boule, agrandissement-réduction" },
  // 2de
  { id: "2-intervalles", level: "2de", title: "Ensembles de nombres, intervalles, valeur absolue" },
  { id: "2-calcul", level: "2de", title: "Calcul algébrique, fractions rationnelles" },
  { id: "2-equations", level: "2de", title: "Équations et inéquations" },
  { id: "2-fonctions", level: "2de", title: "Fonctions de référence" },
  { id: "2-affines", level: "2de", title: "Fonctions affines, droites" },
  { id: "2-vecteurs", level: "2de", title: "Vecteurs et repérage" },
  { id: "2-pourcentages", level: "2de", title: "Pourcentages, évolutions" },
  { id: "2-statistiques", level: "2de", title: "Statistiques et probabilités" },
];

export const chapterById = new Map(CHAPTERS.map((c) => [c.id, c]));

/** Niveau probable d'une classe d'après son nom (« 4e B », « CM2 », « 2de 3 »…) ; sinon la 6e. */
export function levelOfClass(name: string | undefined | null): import("./core").Level {
  const n = (name ?? "").toUpperCase();
  const prim = /\b(CP|CE1|CE2|CM1|CM2)\b/.exec(n);
  if (prim) return prim[1] as "CP";
  const col = /\b([3-6])\s*(E|ÈME|EME)\b/.exec(n);
  if (col) return `${col[1]}e` as "6e";
  if (/\b(2DE|2NDE|SECONDE|1RE|1ÈRE|TLE|TERMINALE|POST|SUP|BAC)\b/.test(n)) return "2de";
  return "6e";
}
