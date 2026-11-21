import type { Lesson } from "./cours1";

/** Leçons à recopier (réservées aux enseignants) : 4e, 3e, seconde. */
export const COURS_2: Lesson[] = [
  // ── 4e ──
  { chapter: "4-relatifs", blocs: [
    { kind: "prop", title: "Règle des signes", text: "Le produit (ou le quotient) de deux nombres de même signe est positif ; de signes contraires, il est négatif.\n(−3) × (−4) = 12 ; (−12) ÷ 3 = −4." },
    { kind: "prop", title: "Produit de plusieurs facteurs", text: "Un produit de facteurs non nuls est positif s'il contient un nombre pair de facteurs négatifs, négatif sinon." },
  ] },
  { chapter: "4-fractions", blocs: [
    { kind: "prop", title: "Produit", text: "(a/b) × (c/d) = (a × c)/(b × d). On simplifie avant de multiplier si possible." },
    { kind: "def", title: "Inverse", text: "L'inverse de a/b (a ≠ 0) est b/a." },
    { kind: "prop", title: "Quotient", text: "Diviser par une fraction, c'est multiplier par son inverse : (a/b) ÷ (c/d) = (a/b) × (d/c)." },
  ] },
  { chapter: "4-puissances", blocs: [
    { kind: "def", title: "Puissance", text: "aⁿ = a × a × … × a (n facteurs). a⁰ = 1 ; a⁻ⁿ = 1/aⁿ." },
    { kind: "prop", title: "Règles de calcul", text: "aᵐ × aⁿ = aᵐ⁺ⁿ ; aᵐ / aⁿ = aᵐ⁻ⁿ ; (aᵐ)ⁿ = aᵐˣⁿ." },
    { kind: "prop", title: "Puissances de 10", text: "10ⁿ = 1 suivi de n zéros ; 10⁻ⁿ = 0,0…01 avec n chiffres après la virgule." },
  ] },
  { chapter: "4-litteral", blocs: [
    { kind: "def", title: "Développer", text: "Transformer un produit en somme : k(a + b) = ka + kb." },
    { kind: "prop", title: "Parenthèses précédées de −", text: "On peut supprimer des parenthèses précédées d'un signe − en changeant le signe de chaque terme : 5 − (2x − 3) = 5 − 2x + 3." },
    { kind: "methode", title: "Réduire", text: "On regroupe les termes en x², en x et les nombres : 3x² − 2x + x² + 5x = 4x² + 3x." },
  ] },
  { chapter: "4-equations", blocs: [
    { kind: "def", title: "Équation", text: "Une égalité contenant une inconnue. Résoudre, c'est trouver toutes les valeurs qui la vérifient." },
    { kind: "prop", title: "Règles", text: "On peut ajouter ou soustraire un même nombre aux deux membres, et les multiplier ou les diviser par un même nombre non nul." },
    { kind: "exemple", text: "3x − 5 = 2x + 4\n3x − 2x = 4 + 5\nx = 9." },
  ] },
  { chapter: "4-pythagore", blocs: [
    { kind: "prop", title: "Théorème de Pythagore", text: "Si un triangle ABC est rectangle en A, alors BC² = AB² + AC² (BC est l'hypoténuse)." },
    { kind: "prop", title: "Réciproque", text: "Si BC² = AB² + AC², alors le triangle ABC est rectangle en A." },
    { kind: "exemple", text: "AB = 3, AC = 4 : BC² = 9 + 16 = 25, donc BC = 5." },
  ] },
  { chapter: "4-proportionnalite", blocs: [
    { kind: "prop", title: "Vitesse", text: "v = d ÷ t ; d = v × t ; t = d ÷ v.\n1 m/s = 3,6 km/h." },
    { kind: "methode", title: "Produit en croix", text: "Si a/b = c/d, alors a × d = b × c : on en déduit la valeur manquante." },
  ] },
  { chapter: "4-statistiques", blocs: [
    { kind: "def", title: "Médiane", text: "Valeur qui partage la série rangée en deux groupes de même effectif." },
    { kind: "def", title: "Étendue", text: "Plus grande valeur − plus petite valeur." },
    { kind: "def", title: "Moyenne pondérée", text: "(x₁ × n₁ + x₂ × n₂ + …) ÷ (n₁ + n₂ + …)." },
  ] },
  { chapter: "4-volumes", blocs: [
    { kind: "prop", title: "Formules", text: "Prisme droit, cylindre : V = aire de la base × hauteur (cylindre : π r² h).\nPyramide, cône : V = (aire de la base × hauteur) ÷ 3 (cône : π r² h / 3)." },
  ] },

  // ── 3e ──
  { chapter: "3-arithmetique", blocs: [
    { kind: "def", title: "Nombre premier", text: "Un entier qui a exactement deux diviseurs : 1 et lui-même (2, 3, 5, 7, 11, 13…)." },
    { kind: "prop", title: "Décomposition", text: "Tout entier ≥ 2 se décompose en produit de facteurs premiers, de façon unique : 60 = 2² × 3 × 5." },
    { kind: "methode", title: "Fraction irréductible", text: "On divise numérateur et dénominateur par leur plus grand diviseur commun." },
  ] },
  { chapter: "3-litteral", blocs: [
    { kind: "prop", title: "Double distributivité", text: "(a + b)(c + d) = ac + ad + bc + bd." },
    { kind: "prop", title: "Identités remarquables", text: "(a + b)² = a² + 2ab + b²\n(a − b)² = a² − 2ab + b²\n(a + b)(a − b) = a² − b²" },
  ] },
  { chapter: "3-factoriser", blocs: [
    { kind: "def", title: "Factoriser", text: "Transformer une somme en produit." },
    { kind: "methode", title: "Facteur commun", text: "ka + kb = k(a + b) : 6x + 9 = 3(2x + 3) ; x² − 5x = x(x − 5)." },
    { kind: "methode", title: "Identité remarquable", text: "a² − b² = (a + b)(a − b) : 4x² − 25 = (2x + 5)(2x − 5)." },
  ] },
  { chapter: "3-equations", blocs: [
    { kind: "prop", title: "Équation produit nul", text: "Un produit est nul si et seulement si l'un au moins de ses facteurs est nul.\n(x − 2)(x + 5) = 0 ⇔ x = 2 ou x = −5." },
    { kind: "prop", title: "x² = a", text: "Si a > 0 : x = √a ou x = −√a. Si a = 0 : x = 0. Si a < 0 : pas de solution." },
    { kind: "prop", title: "Inéquations", text: "Multiplier ou diviser par un nombre négatif change le sens de l'inégalité." },
  ] },
  { chapter: "3-fonctions", blocs: [
    { kind: "def", title: "Fonction", text: "Une fonction f associe à un nombre x un unique nombre f(x), son image. x est un antécédent de f(x)." },
    { kind: "def", title: "Fonction affine", text: "f(x) = ax + b. a est le coefficient directeur, b l'ordonnée à l'origine. Sa représentation est une droite.\nSi b = 0, la fonction est linéaire (proportionnalité)." },
    { kind: "prop", title: "Calcul de a", text: "a = (f(x₂) − f(x₁)) ÷ (x₂ − x₁)." },
  ] },
  { chapter: "3-thales", blocs: [
    { kind: "prop", title: "Théorème de Thalès", text: "Si M ∈ (AB), N ∈ (AC) et (MN) // (BC), alors AM/AB = AN/AC = MN/BC." },
    { kind: "prop", title: "Réciproque", text: "Si A, M, B et A, N, C sont alignés dans le même ordre et AM/AB = AN/AC, alors (MN) // (BC)." },
  ] },
  { chapter: "3-trigo", blocs: [
    { kind: "prop", title: "Dans un triangle rectangle", text: "cos = côté adjacent ÷ hypoténuse\nsin = côté opposé ÷ hypoténuse\ntan = côté opposé ÷ côté adjacent\n(moyen mnémotechnique : SOH CAH TOA)" },
    { kind: "methode", title: "Calculer un angle", text: "On calcule le rapport puis on utilise la touche cos⁻¹ (ou Arccos), sin⁻¹, tan⁻¹ de la calculatrice, en mode degrés." },
  ] },
  { chapter: "3-racines", blocs: [
    { kind: "def", title: "Racine carrée", text: "Pour a ≥ 0, √a est le nombre positif dont le carré est a." },
    { kind: "prop", title: "Règles", text: "√(a × b) = √a × √b ; √(a/b) = √a / √b. Attention : √(a + b) ≠ √a + √b." },
    { kind: "def", title: "Notation scientifique", text: "a × 10ⁿ avec 1 ≤ a < 10 et n entier relatif : 0,000 42 = 4,2 × 10⁻⁴." },
  ] },
  { chapter: "3-probabilites", blocs: [
    { kind: "prop", title: "Événement contraire", text: "P(non A) = 1 − P(A)." },
    { kind: "methode", title: "Deux épreuves", text: "On représente les issues dans un tableau à double entrée ou un arbre. Deux dés : 36 issues équiprobables." },
  ] },
  { chapter: "3-sphere", blocs: [
    { kind: "prop", title: "Sphère et boule", text: "Aire d'une sphère de rayon r : 4πr².\nVolume d'une boule de rayon r : (4/3)πr³." },
    { kind: "prop", title: "Agrandissement, réduction", text: "Si les longueurs sont multipliées par k, les aires le sont par k² et les volumes par k³." },
  ] },

  // ── Seconde ──
  { chapter: "2-intervalles", blocs: [
    { kind: "def", title: "Ensembles", text: "ℕ ⊂ ℤ ⊂ 𝔻 ⊂ ℚ ⊂ ℝ." },
    { kind: "def", title: "Intervalles", text: "[a ; b] : a ≤ x ≤ b. ]a ; b[ : a < x < b. Le crochet tourné vers l'extérieur exclut la borne." },
    { kind: "def", title: "Valeur absolue", text: "|x| est la distance de x à 0. |a − b| est la distance entre a et b." },
  ] },
  { chapter: "2-calcul", blocs: [
    { kind: "prop", title: "Rappels", text: "Identités remarquables, règles sur les puissances et les fractions (voir 3e)." },
    { kind: "methode", title: "Mettre au même dénominateur", text: "1/x + 2/(x + 1) = (x + 1 + 2x)/(x(x + 1)) = (3x + 1)/(x(x + 1)), pour x ≠ 0 et x ≠ −1." },
  ] },
  { chapter: "2-equations", blocs: [
    { kind: "prop", title: "Équation quotient", text: "A/B = 0 ⇔ A = 0 et B ≠ 0." },
    { kind: "prop", title: "Inéquation ax + b ≤ 0", text: "Si a > 0 : x ≤ −b/a. Si a < 0 : x ≥ −b/a." },
    { kind: "methode", title: "Système de deux équations", text: "Par substitution (on exprime une inconnue en fonction de l'autre) ou par combinaison (on élimine une inconnue)." },
  ] },
  { chapter: "2-fonctions", blocs: [
    { kind: "def", title: "Fonctions de référence", text: "Carré : x ↦ x² (décroissante sur ]−∞ ; 0], croissante sur [0 ; +∞[).\nInverse : x ↦ 1/x (définie sur ℝ*, décroissante sur chaque intervalle).\nRacine carrée : x ↦ √x (définie et croissante sur [0 ; +∞[)." },
  ] },
  { chapter: "2-affines", blocs: [
    { kind: "prop", title: "Équation réduite d'une droite", text: "Une droite non verticale a une équation y = mx + p. m = (yB − yA)/(xB − xA)." },
    { kind: "prop", title: "Signe de ax + b", text: "ax + b s'annule en x = −b/a ; il est du signe de a à droite de cette valeur." },
  ] },
  { chapter: "2-vecteurs", blocs: [
    { kind: "prop", title: "Coordonnées", text: "AB(xB − xA ; yB − yA). Milieu de [AB] : ((xA + xB)/2 ; (yA + yB)/2).\nAB = √((xB − xA)² + (yB − yA)²) dans un repère orthonormé." },
    { kind: "prop", title: "Colinéarité", text: "u(x ; y) et v(x' ; y') sont colinéaires ⇔ xy' − x'y = 0." },
  ] },
  { chapter: "2-pourcentages", blocs: [
    { kind: "prop", title: "Coefficient multiplicateur", text: "Augmenter de t % : multiplier par 1 + t/100. Diminuer de t % : multiplier par 1 − t/100." },
    { kind: "prop", title: "Évolutions successives", text: "Les coefficients se multiplient. Taux d'évolution = (V₂ − V₁)/V₁." },
  ] },
  { chapter: "2-statistiques", blocs: [
    { kind: "def", title: "Quartiles", text: "Q1 : plus petite valeur telle qu'au moins 25 % des valeurs lui soient inférieures ou égales ; Q3 : idem avec 75 %." },
    { kind: "prop", title: "Probabilités", text: "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)." },
  ] },
];
