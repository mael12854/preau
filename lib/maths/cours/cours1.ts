/** Leçons à recopier (réservées aux enseignants) : primaire, 6e, 5e. */
export type Bloc = { kind: "def" | "prop" | "methode" | "exemple" | "remarque"; title?: string; text: string };
export type Lesson = { chapter: string; intro?: string; blocs: Bloc[] };

export const COURS_1: Lesson[] = [
  // ── CP ──
  { chapter: "cp-nombres", blocs: [
    { kind: "def", title: "Dizaines et unités", text: "10 unités forment 1 dizaine.\n34, c'est 3 dizaines et 4 unités : 34 = 30 + 4." },
    { kind: "prop", title: "La file des nombres", text: "Pour trouver le nombre suivant, on ajoute 1. Pour trouver le nombre précédent, on enlève 1.\nAprès 39 vient 40 : on passe à la dizaine suivante." },
    { kind: "exemple", text: "5 dizaines et 2 unités → 52.\n52 < 61 car 5 dizaines < 6 dizaines." },
  ] },
  { chapter: "cp-additions", blocs: [
    { kind: "def", title: "Ajouter, enlever", text: "Additionner, c'est ajouter : 7 + 3 = 10.\nSoustraire, c'est enlever : 10 − 3 = 7." },
    { kind: "methode", title: "Les compléments à 10", text: "1 + 9 ; 2 + 8 ; 3 + 7 ; 4 + 6 ; 5 + 5 font 10. Je les connais par cœur." },
    { kind: "methode", title: "Passer par 10", text: "8 + 5 = 8 + 2 + 3 = 10 + 3 = 13." },
  ] },
  { chapter: "cp-problemes", blocs: [
    { kind: "methode", title: "Résoudre un problème", text: "1. Je lis l'énoncé.\n2. Je cherche ce qu'on me demande.\n3. Je choisis : on ajoute (+) ou on enlève (−) ?\n4. Je calcule et j'écris une phrase-réponse." },
    { kind: "exemple", text: "Léa a 12 billes, elle en gagne 5. 12 + 5 = 17. Léa a maintenant 17 billes." },
  ] },
  // ── CE1 ──
  { chapter: "ce1-nombres", blocs: [
    { kind: "def", title: "Centaines, dizaines, unités", text: "1 centaine = 10 dizaines = 100 unités.\n347 = 3 centaines + 4 dizaines + 7 unités = 300 + 40 + 7." },
    { kind: "methode", title: "Comparer deux nombres", text: "On compare d'abord les centaines, puis les dizaines, puis les unités.\n452 > 425 car 5 dizaines > 2 dizaines." },
  ] },
  { chapter: "ce1-calcul", blocs: [
    { kind: "methode", title: "Addition posée", text: "On aligne les unités sous les unités, les dizaines sous les dizaines.\nOn commence par les unités ; si on dépasse 9, on pose la retenue au rang des dizaines." },
    { kind: "def", title: "Double et moitié", text: "Le double de 15 est 30 (15 + 15).\nLa moitié de 30 est 15." },
  ] },
  { chapter: "ce1-tables", blocs: [
    { kind: "def", title: "La multiplication", text: "3 × 4, c'est 4 + 4 + 4 = 12 (3 fois 4).\n3 × 4 = 4 × 3 : on peut changer l'ordre." },
    { kind: "remarque", title: "À savoir par cœur", text: "Tables de 2, 3, 4, 5 et 10.\nMultiplier par 10 : on ajoute un 0 (7 × 10 = 70)." },
  ] },
  { chapter: "ce1-mesures", blocs: [
    { kind: "prop", title: "Mesures", text: "1 m = 100 cm.\n1 € = 100 centimes.\n1 h = 60 min." },
    { kind: "methode", title: "Rendre la monnaie", text: "On compte ce qui manque du prix jusqu'à la somme donnée : prix 7 €, je donne 10 € → 7 + 3 = 10, on me rend 3 €." },
  ] },
  // ── CE2 ──
  { chapter: "ce2-nombres", blocs: [
    { kind: "def", title: "Les milliers", text: "1 millier = 10 centaines = 1 000 unités.\n4 382 = 4 milliers + 3 centaines + 8 dizaines + 2 unités." },
    { kind: "methode", title: "Arrondir à la centaine", text: "On regarde le chiffre des dizaines : de 0 à 4 on arrondit en dessous, de 5 à 9 au-dessus.\n4 382 ≈ 4 400." },
  ] },
  { chapter: "ce2-tables", blocs: [
    { kind: "remarque", title: "Toutes les tables", text: "On apprend les tables de 2 à 9.\nAstuces : × 9 = × 10 − une fois (9 × 7 = 70 − 7 = 63) ; × 5, le résultat finit par 0 ou 5." },
  ] },
  { chapter: "ce2-calcul", blocs: [
    { kind: "methode", title: "Multiplication posée", text: "128 × 4 : 4 × 8 = 32 (je pose 2, retenue 3), 4 × 2 = 8, + 3 = 11 (je pose 1, retenue 1), 4 × 1 = 4, + 1 = 5. Résultat : 512." },
    { kind: "def", title: "Partager", text: "Partager 24 bonbons entre 4 enfants : chacun en a 6 car 4 × 6 = 24." },
  ] },
  { chapter: "ce2-mesures", blocs: [
    { kind: "prop", title: "Tableau des mesures", text: "1 km = 1 000 m ; 1 m = 100 cm ; 1 cm = 10 mm.\n1 kg = 1 000 g.\n1 h = 60 min ; 1 min = 60 s." },
  ] },
  { chapter: "ce2-problemes", blocs: [
    { kind: "methode", title: "Problèmes à étapes", text: "Je cherche d'abord ce que je peux calculer, puis je m'en sers pour la question.\nJe vérifie que mon résultat est vraisemblable." },
  ] },
  // ── CM1 ──
  { chapter: "cm1-nombres", blocs: [
    { kind: "def", title: "Les classes", text: "On regroupe les chiffres par 3 : classe des millions, des milliers, des unités.\n12 045 300 : 12 millions, 45 mille, 300." },
  ] },
  { chapter: "cm1-fractions", blocs: [
    { kind: "def", title: "Une fraction", text: "3/4 : on partage l'unité en 4 parts égales et on en prend 3.\n4 est le dénominateur, 3 le numérateur." },
    { kind: "methode", title: "Fraction d'une quantité", text: "3/4 de 20 : 20 ÷ 4 = 5, puis 5 × 3 = 15." },
  ] },
  { chapter: "cm1-decimaux", blocs: [
    { kind: "def", title: "Dixièmes et centièmes", text: "1/10 = 0,1 (un dixième) ; 1/100 = 0,01 (un centième).\n3,47 = 3 + 4/10 + 7/100." },
    { kind: "methode", title: "Comparer des décimaux", text: "On compare d'abord les parties entières, puis les dixièmes, puis les centièmes.\n2,8 > 2,75 car 8 dixièmes > 7 dixièmes." },
  ] },
  { chapter: "cm1-calcul", blocs: [
    { kind: "methode", title: "Multiplier par un nombre à 2 chiffres", text: "34 × 26 = 34 × 6 + 34 × 20 = 204 + 680 = 884." },
    { kind: "def", title: "Division", text: "Dans 85 ÷ 4 : 85 = 4 × 21 + 1. 21 est le quotient, 1 le reste (toujours plus petit que 4)." },
  ] },
  { chapter: "cm1-mesures", blocs: [
    { kind: "def", title: "Périmètre", text: "Le périmètre est la longueur du tour d'une figure." },
    { kind: "prop", title: "Formules", text: "Carré de côté c : P = 4 × c.\nRectangle de longueur L et largeur l : P = 2 × (L + l)." },
  ] },
  // ── CM2 ──
  { chapter: "cm2-decimaux", blocs: [
    { kind: "methode", title: "Additionner, soustraire", text: "On pose en alignant les virgules (on peut compléter avec des 0) : 12,5 + 3,75 = 12,50 + 3,75 = 16,25." },
    { kind: "methode", title: "Multiplier par 10, 100, 1 000", text: "La virgule se déplace de 1, 2, 3 rangs vers la droite : 3,14 × 100 = 314." },
  ] },
  { chapter: "cm2-fractions", blocs: [
    { kind: "prop", title: "Fractions égales", text: "On ne change pas une fraction en multipliant (ou divisant) son numérateur et son dénominateur par un même nombre : 3/4 = 6/8 = 75/100." },
    { kind: "methode", title: "Écriture décimale", text: "75/100 = 0,75 ; 32/10 = 3,2." },
  ] },
  { chapter: "cm2-division", blocs: [
    { kind: "methode", title: "Poser une division", text: "On cherche combien de fois le diviseur va dans le dividende, rang par rang, en abaissant les chiffres.\nVérification : dividende = diviseur × quotient + reste." },
  ] },
  { chapter: "cm2-proportionnalite", blocs: [
    { kind: "def", title: "Situation de proportionnalité", text: "Deux grandeurs sont proportionnelles quand on passe de l'une à l'autre en multipliant toujours par le même nombre." },
    { kind: "methode", title: "Passer par l'unité", text: "3 cahiers coûtent 6 €, donc 1 cahier coûte 2 €, donc 7 cahiers coûtent 14 €." },
  ] },
  { chapter: "cm2-mesures", blocs: [
    { kind: "def", title: "Aire", text: "L'aire mesure la surface. Rectangle : A = L × l (en cm², m²…)." },
    { kind: "prop", title: "Durées", text: "1 h = 60 min. Pour calculer une durée, on peut compter de l'heure de début jusqu'à l'heure ronde, puis jusqu'à l'heure de fin." },
  ] },

  // ── 6e ──
  { chapter: "6-entiers", blocs: [
    { kind: "def", title: "Écriture décimale", text: "Dans 352,184 : 3 centaines, 5 dizaines, 2 unités, 1 dixième, 8 centièmes, 4 millièmes.\n352,184 = 352 + 184/1000." },
    { kind: "methode", title: "Comparer des décimaux", text: "On compare les parties entières ; si elles sont égales, on compare chiffre à chiffre après la virgule.\n12,7 > 12,69." },
    { kind: "methode", title: "Arrondir", text: "Pour arrondir au dixième, on regarde le chiffre des centièmes : 0 à 4 → on garde ; 5 à 9 → on ajoute 1 au dixième.\n7,46 ≈ 7,5." },
  ] },
  { chapter: "6-operations", blocs: [
    { kind: "methode", title: "Multiplier deux décimaux", text: "On multiplie sans tenir compte des virgules, puis on place autant de chiffres après la virgule qu'il y en a au total dans les facteurs.\n2,4 × 1,5 : 24 × 15 = 360, deux chiffres après la virgule → 3,60 = 3,6." },
    { kind: "prop", title: "Multiplier par 0,1 ; 0,01", text: "Multiplier par 0,1 revient à diviser par 10 ; par 0,01, à diviser par 100." },
  ] },
  { chapter: "6-division", blocs: [
    { kind: "def", title: "Division euclidienne", text: "Effectuer la division euclidienne de a par b (b ≠ 0), c'est trouver q et r tels que a = b × q + r avec r < b." },
    { kind: "prop", title: "Critères de divisibilité", text: "Par 2 : chiffre des unités pair. Par 5 : unités 0 ou 5. Par 10 : unités 0.\nPar 3 : somme des chiffres multiple de 3. Par 9 : somme des chiffres multiple de 9." },
  ] },
  { chapter: "6-fractions", blocs: [
    { kind: "def", title: "Quotient", text: "a/b est le nombre qui, multiplié par b, donne a : b × (a/b) = a." },
    { kind: "prop", title: "Égalité de fractions", text: "a/b = (a × k)/(b × k) pour tout k non nul. On simplifie en divisant numérateur et dénominateur par un diviseur commun." },
    { kind: "methode", title: "Fraction d'une quantité", text: "3/5 de 40 = (40 ÷ 5) × 3 = 24." },
  ] },
  { chapter: "6-proportionnalite", blocs: [
    { kind: "def", title: "Proportionnalité", text: "Un tableau est de proportionnalité si l'on passe de la 1re ligne à la 2e en multipliant toujours par le même nombre, le coefficient de proportionnalité." },
    { kind: "def", title: "Pourcentage", text: "t % de A = A × t / 100. 20 % de 150 = 150 × 20 / 100 = 30." },
  ] },
  { chapter: "6-grandeurs", blocs: [
    { kind: "prop", title: "Tableau de conversion des longueurs", text: "km | hm | dam | m | dm | cm | mm : chaque unité vaut 10 fois la suivante.\n3,25 m = 325 cm." },
    { kind: "prop", title: "Durées", text: "1 h = 60 min ; 1,5 h = 1 h 30 min ; 0,25 h = 15 min." },
  ] },
  { chapter: "6-perimetres-aires", blocs: [
    { kind: "prop", title: "Formules", text: "Cercle de rayon r : P = 2 × π × r.\nRectangle : A = L × l. Carré : A = c × c.\nTriangle rectangle : A = (a × b) ÷ 2 (côtés de l'angle droit)." },
    { kind: "prop", title: "Unités d'aire", text: "Chaque unité d'aire vaut 100 fois la suivante : 1 m² = 100 dm² = 10 000 cm².\n1 ha = 10 000 m²." },
  ] },
  { chapter: "6-angles", blocs: [
    { kind: "def", title: "Nature d'un angle", text: "Aigu : entre 0° et 90°. Droit : 90°. Obtus : entre 90° et 180°. Plat : 180°." },
    { kind: "methode", title: "Utiliser le rapporteur", text: "On place le centre du rapporteur sur le sommet, le 0 sur un côté, et on lit sur la même graduation." },
  ] },
  { chapter: "6-volumes", blocs: [
    { kind: "prop", title: "Pavé droit", text: "V = L × l × h.\n1 dm³ = 1 L ; 1 cm³ = 1 mL." },
  ] },

  // ── 5e ──
  { chapter: "5-priorites", blocs: [
    { kind: "prop", title: "Ordre des calculs", text: "1. Les calculs entre parenthèses.\n2. Les multiplications et divisions (de gauche à droite).\n3. Les additions et soustractions (de gauche à droite)." },
    { kind: "exemple", text: "5 + 3 × (8 − 2) = 5 + 3 × 6 = 5 + 18 = 23." },
  ] },
  { chapter: "5-relatifs", blocs: [
    { kind: "def", title: "Nombres relatifs", text: "Un nombre relatif a un signe et une distance à zéro. −7 a pour distance à zéro 7. Deux nombres opposés : 4 et −4." },
    { kind: "prop", title: "Addition", text: "Même signe : on garde le signe et on additionne les distances à zéro.\nSignes contraires : on prend le signe de celui qui a la plus grande distance à zéro et on soustrait." },
    { kind: "prop", title: "Soustraction", text: "Soustraire un nombre, c'est ajouter son opposé : 3 − (−5) = 3 + 5 = 8." },
  ] },
  { chapter: "5-fractions", blocs: [
    { kind: "prop", title: "Comparer", text: "Avec le même dénominateur, la plus grande fraction est celle qui a le plus grand numérateur. Sinon, on les met au même dénominateur." },
    { kind: "prop", title: "Additionner", text: "a/d + b/d = (a + b)/d. Si les dénominateurs diffèrent, on les met d'abord au même dénominateur.\n2/3 + 1/6 = 4/6 + 1/6 = 5/6." },
  ] },
  { chapter: "5-litteral", blocs: [
    { kind: "def", title: "Expression littérale", text: "Une expression contenant une ou plusieurs lettres. 3x signifie 3 × x." },
    { kind: "prop", title: "Distributivité", text: "k × (a + b) = k × a + k × b." },
    { kind: "methode", title: "Réduire", text: "On regroupe les termes de même nature : 4x + 3 − x + 5 = 3x + 8." },
  ] },
  { chapter: "5-proportionnalite", blocs: [
    { kind: "def", title: "Échelle", text: "Échelle = distance sur le plan / distance réelle (même unité). 1/25 000 : 1 cm sur la carte = 25 000 cm = 250 m en réalité." },
    { kind: "def", title: "Ratio", text: "Partager 60 dans le ratio 2 : 3, c'est faire 5 parts de 12 : 24 et 36." },
  ] },
  { chapter: "5-triangles", blocs: [
    { kind: "prop", title: "Somme des angles", text: "Dans un triangle, la somme des trois angles vaut 180°." },
    { kind: "prop", title: "Inégalité triangulaire", text: "Un triangle est constructible si la plus grande longueur est strictement inférieure à la somme des deux autres." },
    { kind: "prop", title: "Triangles particuliers", text: "Isocèle : deux angles à la base égaux. Équilatéral : trois angles de 60°." },
  ] },
  { chapter: "5-aires", blocs: [
    { kind: "prop", title: "Formules", text: "Triangle : A = (base × hauteur) ÷ 2.\nParallélogramme : A = base × hauteur.\nDisque de rayon r : A = π × r²." },
  ] },
  { chapter: "5-statistiques", blocs: [
    { kind: "def", title: "Moyenne", text: "Moyenne = somme des valeurs ÷ nombre de valeurs." },
    { kind: "def", title: "Fréquence", text: "Fréquence = effectif de la valeur ÷ effectif total (souvent écrite en %)." },
  ] },
  { chapter: "5-probabilites", blocs: [
    { kind: "def", title: "Vocabulaire", text: "Une expérience aléatoire a des issues. Un événement est un ensemble d'issues." },
    { kind: "prop", title: "Équiprobabilité", text: "Si toutes les issues ont la même chance : P(A) = nombre d'issues favorables ÷ nombre d'issues possibles.\nUne probabilité est toujours entre 0 et 1." },
  ] },
];
