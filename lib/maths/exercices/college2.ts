import { type Exercise, type Level, fr, frac, gcd, mono, par, poly, showFrac } from "../core";

const ex = (level: Level, chapter: string, id: string, title: string, make: Exercise["make"]): Exercise => ({
  id,
  level,
  chapter,
  title,
  make,
});
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
/** Expression « ax + b » attendue (forme lisible pour la correction, forme machine pour la réponse). */
const lin = (a: number, b: number) => `${a}x+${b}`;
const linShow = (a: number, b: number) => poly([a, b]);
/** Fraction affichée telle quelle (non simplifiée) : −3/4. */
const rawFrac = (n: number, d: number) => `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`;
/** Numérateur qui ne donne pas un entier déguisé (6/6, 4/2…). */
const notMultiple = (n: number, d: number) => (n % d === 0 ? n + (n > 0 ? 1 : -1) : n);
const PYTHA = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
  [12, 16, 20],
  [20, 21, 29],
];

/** 4e, 3e et seconde. */
export const COLLEGE_2: Exercise[] = [
  // ── 4e ──
  ex("4e", "4-relatifs", "4-rel-mult", "Multiplier des relatifs", (r) => {
    const a = r.nz(-12, 12);
    const b = r.nz(-12, 12);
    return { prompt: `${par(a)} × ${par(b)} = ?`, kind: "number", answer: String(a * b), solution: `Signe : ${a * b < 0 ? "−" : "+"} ; ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}, donc ${fr(a * b)}.` };
  }),
  ex("4e", "4-relatifs", "4-rel-div", "Diviser des relatifs", (r) => {
    const b = r.nz(-9, 9);
    const q = r.nz(-12, 12);
    return { prompt: `${par(b * q)} ÷ ${par(b)} = ?`, kind: "number", answer: String(q), solution: `${fr(b * q)} ÷ ${par(b)} = ${fr(q)}.` };
  }),
  ex("4e", "4-relatifs", "4-rel-signe-produit", "Signe d'un produit", (r) => {
    const xs = Array.from({ length: r.int(3, 6) }, () => r.nz(-9, 9));
    const neg = xs.filter((x) => x < 0).length;
    return { prompt: `Quel est le signe de ${xs.map(par).join(" × ")} ?`, kind: "choice", choices: ["Positif", "Négatif"], answer: neg % 2 ? "Négatif" : "Positif", solution: `${neg} facteur(s) négatif(s) : ${neg % 2 ? "nombre impair, produit négatif" : "nombre pair, produit positif"}.` };
  }),
  ex("4e", "4-relatifs", "4-rel-calcul", "Enchaîner les calculs avec des relatifs", (r) => {
    const a = r.nz(-9, 9);
    const b = r.nz(-9, 9);
    const c = r.nz(-9, 9);
    return { prompt: `${par(a)} − ${par(b)} × ${par(c)} = ?`, kind: "number", answer: String(a - b * c), solution: `${par(b)} × ${par(c)} = ${fr(b * c)}, puis ${par(a)} − ${par(b * c)} = ${fr(a - b * c)}.` };
  }),
  ex("4e", "4-fractions", "4-frac-produit", "Produit de fractions", (r) => {
    const b = r.int(2, 9);
    const d = r.int(2, 9);
    const a = notMultiple(r.nz(-9, 9), b);
    const c = notMultiple(r.nz(-9, 9), d);
    return { prompt: `${rawFrac(a, b)} × ${rawFrac(c, d)} = ? (forme simplifiée)`, kind: "fraction", answer: frac(a * c, b * d), solution: `(${a} × ${c}) / (${b} × ${d}) = ${showFrac(a * c, b * d)}.` };
  }),
  ex("4e", "4-fractions", "4-frac-quotient", "Quotient de fractions", (r) => {
    const b = r.int(2, 9);
    const d = r.int(2, 9);
    const a = notMultiple(r.int(1, 9), b);
    const c = notMultiple(r.int(1, 9), d);
    return { prompt: `${a}/${b} ÷ ${c}/${d} = ? (forme simplifiée)`, kind: "fraction", answer: frac(a * d, b * c), solution: `Diviser, c'est multiplier par l'inverse : ${a}/${b} × ${d}/${c} = ${showFrac(a * d, b * c)}.` };
  }),
  ex("4e", "4-fractions", "4-frac-somme-relatifs", "Somme de fractions de signes différents", (r) => {
    const b = r.int(2, 8);
    const d = r.int(2, 8);
    const a = notMultiple(r.nz(-9, 9), b);
    const c = notMultiple(r.nz(-9, 9), d);
    return { prompt: `${rawFrac(a, b)} + ${rawFrac(c, d)} = ? (forme simplifiée)`, kind: "fraction", answer: frac(a * d + c * b, b * d), solution: `Dénominateur ${b * d} : (${a * d} + ${par(c * b)}) / ${b * d} = ${showFrac(a * d + c * b, b * d)}.` };
  }),
  ex("4e", "4-puissances", "4-puiss-calcul", "Calculer une puissance", (r) => {
    const a = r.nz(-5, 5);
    const n = r.int(2, a === 2 || a === -2 ? 6 : 4);
    return { prompt: `${par(a)}^${n} = ?`, kind: "number", answer: String(a ** n), solution: `${Array(n).fill(par(a)).join(" × ")} = ${fr(a ** n)}.` };
  }),
  ex("4e", "4-puissances", "4-puiss-10", "Puissances de 10", (r) => {
    const n = r.int(-6, 6);
    return { prompt: `Écris 10^${n} sous forme décimale.`, kind: "number", answer: String(10 ** n), solution: `10^${n} = ${fr(10 ** n, 8)}.` };
  }),
  ex("4e", "4-puissances", "4-puiss-produit", "Produit de puissances de même base", (r) => {
    const a = r.int(2, 7);
    const m = r.int(-5, 8);
    const n = r.int(-5, 8);
    return { prompt: `${a}^${m} × ${a}^${n} = ${a}^… (exposant)`, kind: "number", answer: String(m + n), solution: `On additionne les exposants : ${m} + ${par(n)} = ${m + n}.` };
  }),
  ex("4e", "4-puissances", "4-puiss-quotient", "Quotient de puissances", (r) => {
    const m = r.int(-4, 9);
    const n = r.int(-4, 9);
    return { prompt: `10^${m} ÷ 10^${n} = 10^… (exposant)`, kind: "number", answer: String(m - n), solution: `On soustrait : ${m} − ${par(n)} = ${m - n}.` };
  }),
  ex("4e", "4-puissances", "4-puiss-puiss", "Puissance d'une puissance", (r) => {
    const m = r.int(2, 6);
    const n = r.int(-3, 5);
    return { prompt: `(10^${m})^${n} = 10^… (exposant)`, kind: "number", answer: String(m * n), solution: `On multiplie : ${m} × ${par(n)} = ${m * n}.` };
  }),
  ex("4e", "4-litteral", "4-developper", "Développer et réduire", (r) => {
    const k = r.nz(-9, 9);
    const a = r.nz(-6, 6);
    const b = r.nz(-9, 9);
    const c = r.nz(-9, 9);
    return {
      prompt: `Développe et réduis : ${k}(${linShow(a, b)}) ${c < 0 ? "−" : "+"} ${Math.abs(c)}x`,
      kind: "expr", form: "developpee",
      answer: lin(k * a + c, k * b),
      solution: `${fr(k * a)}x ${k * b < 0 ? "−" : "+"} ${Math.abs(k * b)} ${c < 0 ? "−" : "+"} ${Math.abs(c)}x = ${linShow(k * a + c, k * b)}.`,
    };
  }),
  ex("4e", "4-litteral", "4-moins-parenthese", "Supprimer des parenthèses précédées de −", (r) => {
    const a = r.nz(-9, 9);
    const b = r.nz(-9, 9);
    const c = r.nz(-9, 9);
    return { prompt: `Réduis : ${a}x − (${linShow(b, c)})`, kind: "expr", form: "developpee", answer: lin(a - b, -c), solution: `On change les signes dans la parenthèse : ${a}x ${-b < 0 ? "−" : "+"} ${Math.abs(b)}x ${-c < 0 ? "−" : "+"} ${Math.abs(c)} = ${linShow(a - b, -c)}.` };
  }),
  ex("4e", "4-litteral", "4-reduire-x2", "Réduire avec des x²", (r) => {
    const a = r.nz(-6, 6);
    const b = r.nz(-9, 9);
    const c = r.nz(-6, 6);
    const d = r.nz(-9, 9);
    return { prompt: `Réduis : ${poly([a, b, 0])} ${c < 0 ? "−" : "+"} ${Math.abs(c)}x² ${d < 0 ? "−" : "+"} ${Math.abs(d)}x`, kind: "expr", form: "developpee", answer: `${a + c}x^2+${b + d}x`, solution: `${poly([a + c, b + d, 0])}.` };
  }),
  ex("4e", "4-equations", "4-eq-simple", "Équation ax + b = c", (r) => {
    const a = r.nz(-9, 9);
    const x = r.int(-10, 10);
    const b = r.int(-20, 20);
    return { prompt: `Résous : ${linShow(a, b)} = ${fr(a * x + b)}`, kind: "number", answer: String(x), solution: `${mono(a)} = ${fr(a * x + b)} − ${par(b)} = ${fr(a * x)}, donc x = ${fr(a * x)} ÷ ${par(a)} = ${fr(x)}.` };
  }),
  ex("4e", "4-equations", "4-eq-deux-membres", "Équation avec x des deux côtés", (r) => {
    const a = r.nz(-9, 9);
    let c = r.nz(-9, 9);
    if (a === c) c = a + 1 === 0 ? a + 2 : a + 1;
    if (c === 0) c = a === 2 ? 3 : 2;
    const x = r.int(-8, 8);
    const b = r.int(-15, 15);
    const d = a * x + b - c * x;
    return { prompt: `Résous : ${linShow(a, b)} = ${linShow(c, d)}`, kind: "number", answer: String(x), solution: `${fr(a - c)}x = ${fr(d - b)}, donc x = ${fr(x)}.` };
  }),
  ex("4e", "4-equations", "4-eq-fraction", "Équation à solution fractionnaire", (r) => {
    const a = r.int(2, 9);
    const n = r.nz(-20, 20);
    if (n % a === 0) return { prompt: `Résous : ${a}x = ${n + 1}`, kind: "fraction", answer: frac(n + 1, a), solution: `x = ${showFrac(n + 1, a)}.` };
    return { prompt: `Résous : ${a}x = ${fr(n)}`, kind: "fraction", answer: frac(n, a), solution: `x = ${fr(n)} ÷ ${a} = ${showFrac(n, a)}.` };
  }),
  ex("4e", "4-equations", "4-eq-probleme", "Mettre un problème en équation", (r) => {
    const x = r.int(5, 40);
    const k = r.int(2, 5);
    const b = r.int(3, 30);
    return { prompt: `Je pense à un nombre. Je le multiplie par ${k} et j'ajoute ${b} : j'obtiens ${k * x + b}. Quel est ce nombre ?`, kind: "number", answer: String(x), solution: `${k}x + ${b} = ${k * x + b}, donc x = ${x}.` };
  }),
  ex("4e", "4-pythagore", "4-pytha-hyp", "Calculer l'hypoténuse", (r) => {
    const [a, b, c] = r.pick(PYTHA);
    const k = r.pick([1, 1, 2, 0.5]);
    return { prompt: `Triangle rectangle : côtés de l'angle droit ${fr(a * k)} cm et ${fr(b * k)} cm. Longueur de l'hypoténuse ?`, kind: "number", unit: "cm", answer: String(c * k), solution: `${fr(a * k)}² + ${fr(b * k)}² = ${fr((a * k) ** 2 + (b * k) ** 2)} = ${fr(c * k)}², donc ${fr(c * k)} cm.` };
  }),
  ex("4e", "4-pythagore", "4-pytha-cote", "Calculer un côté de l'angle droit", (r) => {
    const [a, b, c] = r.pick(PYTHA);
    return { prompt: `Triangle rectangle d'hypoténuse ${c} cm ; un côté de l'angle droit mesure ${a} cm. L'autre ?`, kind: "number", unit: "cm", answer: String(b), solution: `${c}² − ${a}² = ${c * c - a * a} = ${b}², donc ${b} cm.` };
  }),
  ex("4e", "4-pythagore", "4-pytha-arrondi", "Pythagore avec arrondi", (r) => {
    const a = r.int(2, 15);
    const b = r.int(2, 15);
    const c = Math.sqrt(a * a + b * b);
    return { prompt: `Triangle rectangle : côtés de l'angle droit ${a} cm et ${b} cm. Hypoténuse arrondie au dixième ?`, kind: "number", unit: "cm", tolerance: 0.051, answer: String(r1(c)), solution: `√(${a * a} + ${b * b}) = √${a * a + b * b} ≈ ${fr(r1(c))} cm.` };
  }),
  ex("4e", "4-pythagore", "4-pytha-reciproque", "Le triangle est-il rectangle ?", (r) => {
    const [a, b, c] = r.pick(PYTHA);
    const ok = r.next() < 0.5;
    const cc = ok ? c : c + 1;
    return { prompt: `Un triangle a pour côtés ${a} cm, ${b} cm et ${cc} cm. Est-il rectangle ?`, kind: "choice", choices: ["Oui", "Non"], answer: ok ? "Oui" : "Non", solution: `${a}² + ${b}² = ${a * a + b * b} ; ${cc}² = ${cc * cc} : ${ok ? "égalité, il est rectangle" : "pas d'égalité, il n'est pas rectangle"}.` };
  }),
  ex("4e", "4-proportionnalite", "4-vitesse", "Vitesse moyenne", (r) => {
    const v = r.int(4, 130);
    const t = r.pick([0.5, 1.5, 2, 2.5, 3, 0.25, 0.75]);
    return { prompt: `On parcourt ${fr(v * t)} km en ${fr(t)} h. Vitesse moyenne en km/h ?`, kind: "number", unit: "km/h", answer: String(v), solution: `${fr(v * t)} ÷ ${fr(t)} = ${v} km/h.` };
  }),
  ex("4e", "4-proportionnalite", "4-distance", "Distance parcourue", (r) => {
    const v = r.int(30, 120);
    const min = r.pick([15, 20, 30, 40, 45, 90]);
    return { prompt: `À ${v} km/h, quelle distance parcourt-on en ${min} min ?`, kind: "number", unit: "km", answer: String(r2((v * min) / 60)), solution: `${min} min = ${fr(min / 60, 3)} h ; ${v} × ${min}/60 = ${fr(r2((v * min) / 60))} km.` };
  }),
  ex("4e", "4-proportionnalite", "4-conv-vitesse", "Convertir une vitesse", (r) => {
    const v = r.pick([18, 36, 54, 72, 90, 108, 126, 144]);
    return { prompt: `${v} km/h = … m/s`, kind: "number", unit: "m/s", answer: String(v / 3.6), solution: `${v} × 1 000 ÷ 3 600 = ${fr(v / 3.6)} m/s.` };
  }),
  ex("4e", "4-statistiques", "4-mediane", "Médiane d'une série", (r) => {
    const n = r.pick([5, 7, 9, 6, 8]);
    const xs = Array.from({ length: n }, () => r.int(1, 30)).sort((a, b) => a - b);
    const med = n % 2 ? xs[(n - 1) / 2] : (xs[n / 2 - 1] + xs[n / 2]) / 2;
    return { prompt: `Série : ${r.shuffle(xs).join(" ; ")}. Médiane ?`, kind: "number", answer: String(med), solution: `Série rangée : ${xs.join(" ; ")}. Médiane : ${fr(med)}.` };
  }),
  ex("4e", "4-statistiques", "4-etendue", "Étendue d'une série", (r) => {
    const xs = Array.from({ length: r.int(5, 9) }, () => r.int(-5, 40));
    return { prompt: `Série : ${xs.join(" ; ")}. Étendue ?`, kind: "number", answer: String(Math.max(...xs) - Math.min(...xs)), solution: `${Math.max(...xs)} − ${par(Math.min(...xs))} = ${Math.max(...xs) - Math.min(...xs)}.` };
  }),
  ex("4e", "4-statistiques", "4-moyenne-ponderee", "Moyenne pondérée", (r) => {
    const n1 = r.int(8, 18);
    const n2 = r.int(5, 20);
    const c1 = r.int(1, 4);
    const c2 = r.int(1, 4);
    const m = (n1 * c1 + n2 * c2) / (c1 + c2);
    return { prompt: `Note ${n1} (coefficient ${c1}) et note ${n2} (coefficient ${c2}). Moyenne, arrondie au dixième ?`, kind: "number", tolerance: 0.051, answer: String(r1(m)), solution: `(${n1} × ${c1} + ${n2} × ${c2}) ÷ ${c1 + c2} ≈ ${fr(r1(m))}.` };
  }),
  ex("4e", "4-volumes", "4-vol-cylindre", "Volume d'un cylindre", (r) => {
    const rr = r.int(1, 10);
    const h = r.int(2, 20);
    const v = Math.PI * rr * rr * h;
    return { prompt: `Volume d'un cylindre de rayon ${rr} cm et de hauteur ${h} cm, arrondi à l'unité ?`, kind: "number", unit: "cm³", tolerance: 0.51, answer: String(Math.round(v)), solution: `π × ${rr}² × ${h} ≈ ${Math.round(v)} cm³.` };
  }),
  ex("4e", "4-volumes", "4-vol-pyramide", "Volume d'une pyramide", (r) => {
    const c = r.int(2, 12);
    const h = r.int(3, 15) * 3;
    return { prompt: `Pyramide à base carrée de côté ${c} cm et de hauteur ${h} cm. Volume ?`, kind: "number", unit: "cm³", answer: String((c * c * h) / 3), solution: `(${c}² × ${h}) ÷ 3 = ${fr((c * c * h) / 3)} cm³.` };
  }),
  ex("4e", "4-volumes", "4-vol-cone", "Volume d'un cône", (r) => {
    const rr = r.int(1, 9);
    const h = r.int(2, 15);
    const v = (Math.PI * rr * rr * h) / 3;
    return { prompt: `Volume d'un cône de rayon ${rr} cm et de hauteur ${h} cm, arrondi au dixième ?`, kind: "number", unit: "cm³", tolerance: 0.051, answer: String(r1(v)), solution: `(π × ${rr}² × ${h}) ÷ 3 ≈ ${fr(r1(v))} cm³.` };
  }),
  ex("4e", "4-volumes", "4-vol-prisme", "Volume d'un prisme droit", (r) => {
    const b = r.int(2, 12);
    const hb = r.int(2, 10);
    const h = r.int(3, 20);
    return { prompt: `Prisme droit à base triangulaire (base ${b} cm, hauteur du triangle ${hb} cm), de hauteur ${h} cm. Volume ?`, kind: "number", unit: "cm³", answer: String((b * hb * h) / 2), solution: `Aire de la base : ${fr((b * hb) / 2)} cm² ; × ${h} = ${fr((b * hb * h) / 2)} cm³.` };
  }),

  // ── 3e ──
  ex("3e", "3-arithmetique", "3-pgcd", "Plus grand diviseur commun", (r) => {
    const g = r.int(2, 30);
    let a = r.int(2, 20);
    let b = r.int(2, 20);
    while (gcd(a, b) !== 1) b++;
    [a, b] = [a * g, b * g];
    return { prompt: `Plus grand diviseur commun de ${a} et ${b} ?`, kind: "number", answer: String(g), solution: `${a} = ${g} × ${a / g} et ${b} = ${g} × ${b / g} : PGCD = ${g}.` };
  }),
  ex("3e", "3-arithmetique", "3-premier", "Nombre premier ?", (r) => {
    const n = r.int(11, 199);
    let p = n > 1;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) p = false;
    let div = 0;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) {
      div = d;
      break;
    }
    return { prompt: `${n} est-il un nombre premier ?`, kind: "choice", choices: ["Oui", "Non"], answer: p ? "Oui" : "Non", solution: p ? `Oui : ${n} n'a pas d'autre diviseur que 1 et lui-même.` : `Non : ${n} = ${div} × ${n / div}.` };
  }),
  ex("3e", "3-arithmetique", "3-decomposition", "Plus petit facteur premier", (r) => {
    const ps = [2, 3, 5, 7, 11, 13];
    const xs = Array.from({ length: r.int(2, 4) }, () => r.pick(ps));
    const n = xs.reduce((a, b) => a * b, 1);
    const min = Math.min(...xs);
    return { prompt: `Quel est le plus petit nombre premier qui divise ${n} ?`, kind: "number", answer: String(min), solution: `${n} = ${xs.sort((a, b) => a - b).join(" × ")}.` };
  }),
  ex("3e", "3-arithmetique", "3-irreductible", "Rendre une fraction irréductible", (r) => {
    const g = r.int(2, 15);
    let a = r.int(2, 25);
    let b = r.int(2, 25);
    while (gcd(a, b) !== 1) b++;
    return { prompt: `Rends irréductible : ${a * g}/${b * g}`, kind: "fraction", answer: frac(a, b), solution: `PGCD = ${g} : ${a}/${b}.` };
  }),
  ex("3e", "3-litteral", "3-double-distrib", "Double distributivité", (r) => {
    const a = r.nz(-5, 5);
    const b = r.nz(-9, 9);
    const c = r.nz(-5, 5);
    const d = r.nz(-9, 9);
    return {
      prompt: `Développe et réduis : (${linShow(a, b)})(${linShow(c, d)})`,
      kind: "expr", form: "developpee",
      answer: `${a * c}x^2+${a * d + b * c}x+${b * d}`,
      solution: `${poly([a * c, a * d + b * c, b * d])}.`,
    };
  }),
  ex("3e", "3-litteral", "3-id-carre-somme", "(a + b)²", (r) => {
    const a = r.int(1, 6);
    const b = r.int(1, 9);
    return { prompt: `Développe : (${mono(a)} + ${b})²`, kind: "expr", form: "developpee", answer: `${a * a}x^2+${2 * a * b}x+${b * b}`, solution: `(a + b)² = a² + 2ab + b² : ${poly([a * a, 2 * a * b, b * b])}.` };
  }),
  ex("3e", "3-litteral", "3-id-carre-diff", "(a − b)²", (r) => {
    const a = r.int(1, 6);
    const b = r.int(1, 9);
    return { prompt: `Développe : (${mono(a)} − ${b})²`, kind: "expr", form: "developpee", answer: `${a * a}x^2-${2 * a * b}x+${b * b}`, solution: `(a − b)² = a² − 2ab + b² : ${poly([a * a, -2 * a * b, b * b])}.` };
  }),
  ex("3e", "3-litteral", "3-id-somme-diff", "(a + b)(a − b)", (r) => {
    const a = r.int(1, 6);
    const b = r.int(1, 12);
    return { prompt: `Développe : (${mono(a)} + ${b})(${mono(a)} − ${b})`, kind: "expr", form: "developpee", answer: `${a * a}x^2-${b * b}`, solution: `(a + b)(a − b) = a² − b² : ${poly([a * a, 0, -b * b])}.` };
  }),
  ex("3e", "3-factoriser", "3-fact-commun", "Factoriser par un facteur commun", (r) => {
    const k = r.int(2, 9);
    const a = r.nz(-6, 6);
    const b = r.nz(-9, 9);
    return { prompt: `Factorise : ${poly([k * a, k * b])}  (forme k(ax + b), k entier positif le plus grand possible)`, kind: "expr", form: "factorisee", answer: `${k * gcd(a, b)}(${a / gcd(a, b)}x+${b / gcd(a, b)})`, solution: `${poly([k * a, k * b])} = ${k * gcd(a, b)}(${linShow(a / gcd(a, b), b / gcd(a, b))}).` };
  }),
  ex("3e", "3-factoriser", "3-fact-x", "Factoriser par x", (r) => {
    const a = r.nz(-9, 9);
    const b = r.nz(-9, 9);
    return { prompt: `Factorise : ${poly([a, b, 0])}`, kind: "expr", form: "factorisee", answer: `x(${a}x+${b})`, solution: `x(${linShow(a, b)}).` };
  }),
  ex("3e", "3-factoriser", "3-fact-id", "Factoriser a² − b²", (r) => {
    const a = r.int(1, 5);
    const b = r.int(1, 12);
    return { prompt: `Factorise : ${poly([a * a, 0, -b * b])}`, kind: "expr", form: "factorisee", answer: `(${a}x+${b})(${a}x-${b})`, solution: `a² − b² = (a + b)(a − b) : (${mono(a)} + ${b})(${mono(a)} − ${b}).` };
  }),
  ex("3e", "3-equations", "3-eq-produit", "Équation produit nul", (r) => {
    const p = r.int(-9, 9);
    let q = r.int(-9, 9);
    if (q === p) q = p + 1;
    const big = Math.max(p, q);
    return { prompt: `(x ${-p < 0 ? "−" : "+"} ${Math.abs(p)})(x ${-q < 0 ? "−" : "+"} ${Math.abs(q)}) = 0 a deux solutions. Donne la plus grande.`, kind: "number", answer: String(big), solution: `Un produit est nul si l'un des facteurs est nul : x = ${fr(p)} ou x = ${fr(q)}.` };
  }),
  ex("3e", "3-equations", "3-eq-carre", "Équation x² = a", (r) => {
    const s = r.int(1, 15);
    return { prompt: `x² = ${s * s}. Donne la solution positive.`, kind: "number", answer: String(s), solution: `x = ${s} ou x = −${s}.` };
  }),
  ex("3e", "3-equations", "3-inequation", "Inéquation : la plus petite solution entière", (r) => {
    const a = r.int(2, 9);
    const b = r.int(-20, 20);
    const c = r.int(-20, 40);
    // ax + b > c  ⇔ x > (c − b)/a
    const lim = (c - b) / a;
    const sol = Math.floor(lim) + 1;
    return { prompt: `Quel est le plus petit entier solution de ${linShow(a, b)} > ${fr(c)} ?`, kind: "number", answer: String(sol), solution: `x > ${showFrac(c - b, a)} (≈ ${fr(r2(lim))}), donc le plus petit entier est ${sol}.` };
  }),
  ex("3e", "3-fonctions", "3-image", "Image par une fonction", (r) => {
    const a = r.nz(-5, 5);
    const b = r.nz(-9, 9);
    const c = r.int(-9, 9);
    const x = r.int(-5, 5);
    return { prompt: `f(x) = ${poly([a, b, c])}. Calcule f(${fr(x)}).`, kind: "number", answer: String(a * x * x + b * x + c), solution: `f(${fr(x)}) = ${a} × ${par(x)}² + ${b} × ${par(x)} + ${par(c)} = ${a * x * x + b * x + c}.` };
  }),
  ex("3e", "3-fonctions", "3-antecedent", "Antécédent par une fonction affine", (r) => {
    const a = r.nz(-6, 6);
    const b = r.int(-10, 10);
    const x = r.int(-10, 10);
    return { prompt: `f(x) = ${linShow(a, b)}. Quel nombre a pour image ${fr(a * x + b)} ?`, kind: "number", answer: String(x), solution: `${linShow(a, b)} = ${fr(a * x + b)} donne x = ${fr(x)}.` };
  }),
  ex("3e", "3-fonctions", "3-coef-directeur", "Coefficient d'une fonction affine", (r) => {
    const a = r.nz(-6, 6);
    const b = r.int(-10, 10);
    const x1 = r.int(-5, 3);
    const x2 = x1 + r.int(1, 5);
    return { prompt: `f est affine, f(${fr(x1)}) = ${fr(a * x1 + b)} et f(${fr(x2)}) = ${fr(a * x2 + b)}. Coefficient directeur ?`, kind: "number", answer: String(a), solution: `(${fr(a * x2 + b)} − ${par(a * x1 + b)}) ÷ (${fr(x2)} − ${par(x1)}) = ${fr(a)}.` };
  }),
  ex("3e", "3-fonctions", "3-expression-affine", "Trouver l'expression d'une fonction affine", (r) => {
    const a = r.nz(-6, 6);
    const b = r.int(-10, 10);
    return { prompt: `f est affine, f(0) = ${fr(b)} et f(1) = ${fr(a + b)}. Donne f(x).`, kind: "expr", answer: lin(a, b), solution: `b = f(0) = ${fr(b)} ; a = f(1) − f(0) = ${fr(a)} : f(x) = ${linShow(a, b)}.` };
  }),
  ex("3e", "3-thales", "3-thales-longueur", "Thalès : calculer une longueur", (r) => {
    const k = r.pick([2, 3, 4, 1.5, 2.5]);
    const am = r.int(2, 10);
    const mn = r.int(2, 10);
    return { prompt: `Les droites (MN) et (BC) sont parallèles, M ∈ [AB], N ∈ [AC]. AM = ${am} cm, AB = ${fr(am * k)} cm, MN = ${mn} cm. Calcule BC.`, kind: "number", unit: "cm", answer: String(r2(mn * k)), solution: `AM/AB = MN/BC, donc BC = ${mn} × ${fr(am * k)} ÷ ${am} = ${fr(r2(mn * k))} cm.` };
  }),
  ex("3e", "3-thales", "3-thales-reciproque", "Réciproque de Thalès", (r) => {
    const am = r.int(2, 9);
    const k = r.pick([2, 3, 4]);
    const an = r.int(2, 9);
    const ok = r.next() < 0.5;
    const ac = ok ? an * k : an * k + 1;
    return { prompt: `AM = ${am}, AB = ${am * k}, AN = ${an}, AC = ${ac} (points alignés dans le même ordre). (MN) et (BC) sont-elles parallèles ?`, kind: "choice", choices: ["Oui", "Non"], answer: ok ? "Oui" : "Non", solution: `AM/AB = ${showFrac(am, am * k)} ; AN/AC = ${showFrac(an, ac)} : ${ok ? "égaux, donc parallèles" : "différents, donc pas parallèles"}.` };
  }),
  ex("3e", "3-trigo", "3-trigo-cote", "Trigonométrie : calculer un côté", (r) => {
    const a = r.int(15, 75);
    const h = r.int(4, 20);
    const f = r.pick(["cos", "sin", "tan"] as const);
    const val = f === "cos" ? h * Math.cos(rad(a)) : f === "sin" ? h * Math.sin(rad(a)) : h * Math.tan(rad(a));
    const prompt =
      f === "tan"
        ? `ABC rectangle en B, angle Â = ${a}°, AB = ${h} cm. Calcule BC (arrondi au dixième).`
        : `ABC rectangle en B, angle Â = ${a}°, AC = ${h} cm. Calcule ${f === "cos" ? "AB" : "BC"} (arrondi au dixième).`;
    return { prompt, kind: "number", unit: "cm", tolerance: 0.051, answer: String(r1(val)), solution: `${f}(${a}°) × ${h} ≈ ${fr(r1(val))} cm.` };
  }),
  ex("3e", "3-trigo", "3-trigo-angle", "Trigonométrie : calculer un angle", (r) => {
    const adj = r.int(3, 15);
    const hyp = adj + r.int(1, 10);
    const a = deg(Math.acos(adj / hyp));
    return { prompt: `ABC rectangle en B, AB = ${adj} cm, AC = ${hyp} cm. Mesure de l'angle Â, arrondie au degré ?`, kind: "number", unit: "°", tolerance: 0.51, answer: String(Math.round(a)), solution: `cos Â = ${adj}/${hyp}, donc Â ≈ ${Math.round(a)}°.` };
  }),
  ex("3e", "3-racines", "3-racine", "Racine carrée", (r) => {
    const n = r.int(1, 20);
    return { prompt: `√${n * n} = ?`, kind: "number", answer: String(n), solution: `${n}² = ${n * n}.` };
  }),
  ex("3e", "3-racines", "3-racine-produit", "Simplifier une racine", (r) => {
    const a = r.pick([2, 3, 5, 6, 7]);
    const k = r.int(2, 6);
    return { prompt: `√${k * k * a} = …√${a}`, kind: "number", answer: String(k), solution: `√${k * k * a} = √${k * k} × √${a} = ${k}√${a}.` };
  }),
  ex("3e", "3-racines", "3-scientifique", "Notation scientifique : l'exposant", (r) => {
    const m = r.dec(1, 9.9, 2);
    const e = r.int(-7, 9);
    return { prompt: `${fr(m * 10 ** e, 10)} = ${fr(m)} × 10^… (exposant)`, kind: "number", answer: String(e), solution: `${fr(m)} × 10^${e}.` };
  }),
  ex("3e", "3-probabilites", "3-proba-deux-des", "Somme de deux dés", (r) => {
    const s = r.int(2, 12);
    let n = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) n++;
    return { prompt: `On lance deux dés équilibrés. Probabilité que la somme fasse ${s} ? (fraction simplifiée)`, kind: "fraction", answer: frac(n, 36), solution: `${n} issues sur 36 : ${showFrac(n, 36)}.` };
  }),
  ex("3e", "3-probabilites", "3-proba-contraire", "Événement contraire", (r) => {
    const d = r.pick([5, 8, 10, 20, 25]);
    const n = r.int(1, d - 1);
    return { prompt: `P(A) = ${showFrac(n, d)}. Calcule P(non A) (fraction simplifiée).`, kind: "fraction", answer: frac(d - n, d), solution: `1 − ${showFrac(n, d)} = ${showFrac(d - n, d)}.` };
  }),
  ex("3e", "3-sphere", "3-vol-boule", "Volume d'une boule", (r) => {
    const rr = r.int(1, 12);
    const v = (4 / 3) * Math.PI * rr ** 3;
    return { prompt: `Volume d'une boule de rayon ${rr} cm, arrondi à l'unité ?`, kind: "number", unit: "cm³", tolerance: 0.51, answer: String(Math.round(v)), solution: `(4/3) × π × ${rr}³ ≈ ${Math.round(v)} cm³.` };
  }),
  ex("3e", "3-sphere", "3-aire-sphere", "Aire d'une sphère", (r) => {
    const rr = r.int(1, 12);
    const a = 4 * Math.PI * rr * rr;
    return { prompt: `Aire d'une sphère de rayon ${rr} cm, arrondie à l'unité ?`, kind: "number", unit: "cm²", tolerance: 0.51, answer: String(Math.round(a)), solution: `4 × π × ${rr}² ≈ ${Math.round(a)} cm².` };
  }),
  ex("3e", "3-sphere", "3-agrandissement", "Agrandissement : effet sur l'aire et le volume", (r) => {
    const k = r.pick([2, 3, 0.5, 1.5, 4]);
    const what = r.pick(["aires", "volumes"] as const);
    const f = what === "aires" ? k * k : k ** 3;
    return { prompt: `On multiplie les longueurs par ${fr(k)}. Par combien sont multipliés les ${what} ?`, kind: "number", answer: String(f), solution: `Les ${what} sont multipliés par ${fr(k)}${what === "aires" ? "²" : "³"} = ${fr(f)}.` };
  }),

  // ── Seconde ──
  ex("2de", "2-intervalles", "2-valeur-absolue", "Valeur absolue", (r) => {
    const a = r.int(-20, 20);
    const b = r.int(-20, 20);
    return { prompt: `|${fr(a)} − ${par(b)}| = ?`, kind: "number", answer: String(Math.abs(a - b)), solution: `${fr(a)} − ${par(b)} = ${fr(a - b)}, et |${fr(a - b)}| = ${Math.abs(a - b)}.` };
  }),
  ex("2de", "2-intervalles", "2-intervalle-entiers", "Entiers dans un intervalle", (r) => {
    const a = r.int(-10, 5);
    const b = a + r.int(2, 12);
    const ga = r.pick(["[", "]"] as const);
    const gb = r.pick(["[", "]"] as const);
    const n = b - a + 1 - (ga === "]" ? 1 : 0) - (gb === "[" ? 1 : 0);
    return { prompt: `Combien d'entiers appartiennent à ${ga}${fr(a)} ; ${fr(b)}${gb} ?`, kind: "number", answer: String(n), solution: `De ${fr(a)} à ${fr(b)} il y a ${b - a + 1} entiers ; on retire les bornes exclues : ${n}.` };
  }),
  ex("2de", "2-calcul", "2-frac-alg", "Fractions : calcul complet", (r) => {
    const a = r.int(1, 9);
    const b = r.int(2, 9);
    const c = r.int(1, 9);
    const d = r.int(2, 9);
    const e = r.int(2, 5);
    return { prompt: `(${a}/${b} − ${c}/${d}) × ${e} = ? (fraction simplifiée)`, kind: "fraction", answer: frac((a * d - c * b) * e, b * d), solution: `${showFrac(a * d - c * b, b * d)} × ${e} = ${showFrac((a * d - c * b) * e, b * d)}.` };
  }),
  ex("2de", "2-calcul", "2-developper-complexe", "Développer et réduire", (r) => {
    const a = r.nz(-4, 4);
    const b = r.nz(-6, 6);
    const c = r.nz(-6, 6);
    return { prompt: `Développe et réduis : (${linShow(a, b)})² − ${par(c)}x`, kind: "expr", form: "developpee", answer: `${a * a}x^2+${2 * a * b - c}x+${b * b}`, solution: `${poly([a * a, 2 * a * b - c, b * b])}.` };
  }),
  ex("2de", "2-calcul", "2-puissances", "Puissances : simplifier", (r) => {
    const m = r.int(2, 6);
    const n = r.int(1, 5);
    const p = r.int(1, 4);
    return { prompt: `(2^${m} × 2^${n}) / 2^${p} = 2^… (exposant)`, kind: "number", answer: String(m + n - p), solution: `${m} + ${n} − ${p} = ${m + n - p}.` };
  }),
  ex("2de", "2-equations", "2-eq-quotient", "Équation quotient", (r) => {
    const a = r.int(-9, 9);
    const b = r.nz(-9, 9);
    const k = r.nz(-5, 5);
    // (x − a) / (x − b) = 0 ⇒ x = a si a ≠ b
    const aa = a === b ? a + 1 : a;
    return { prompt: `Résous : (x ${-aa < 0 ? "−" : "+"} ${Math.abs(aa)}) / (${k}x ${-k * b < 0 ? "−" : "+"} ${Math.abs(k * b)}) = 0`, kind: "number", answer: String(aa), solution: `Un quotient est nul si son numérateur est nul (et le dénominateur non nul) : x = ${fr(aa)}.` };
  }),
  ex("2de", "2-equations", "2-ineq-signe", "Inéquation ax + b ≤ 0 : borne", (r) => {
    const a = r.nz(-8, 8);
    const b = r.nz(-15, 15);
    return { prompt: `Résous ${linShow(a, b)} ≤ 0. Quelle est la borne de l'intervalle solution ? (fraction simplifiée)`, kind: "fraction", answer: frac(-b, a), solution: `x ${a > 0 ? "≤" : "≥"} ${showFrac(-b, a)} (on ${a > 0 ? "garde" : "change"} le sens car on divise par ${fr(a)}).` };
  }),
  ex("2de", "2-equations", "2-systeme", "Système de deux équations", (r) => {
    const x = r.int(-6, 6);
    const y = r.int(-6, 6);
    const a = r.nz(-4, 4);
    const b = r.nz(-4, 4);
    let c = r.nz(-4, 4);
    let d = r.nz(-4, 4);
    if (a * d - b * c === 0) {
      c += 1;
      if (c === 0) c = 2;
      if (a * d - b * c === 0) d += 1;
    }
    return { prompt: `Résous : ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}y = ${a * x + b * y} et ${c}x ${d < 0 ? "−" : "+"} ${Math.abs(d)}y = ${c * x + d * y}. Donne x.`, kind: "number", answer: String(x), solution: `Par combinaison ou substitution : x = ${fr(x)}, y = ${fr(y)}.` };
  }),
  ex("2de", "2-fonctions", "2-carre-image", "Fonction carré", (r) => {
    const x = r.dec(-9, 9, 1);
    return { prompt: `f(x) = x². Calcule f(${fr(x)}).`, kind: "number", answer: String(r2(x * x)), solution: `${par(x)}² = ${fr(r2(x * x))}.` };
  }),
  ex("2de", "2-fonctions", "2-inverse", "Fonction inverse", (r) => {
    const x = r.pick([2, 4, 5, 8, 10, 0.5, 0.25, -2, -4, -0.5]);
    return { prompt: `f(x) = 1/x. Calcule f(${fr(x)}).`, kind: "number", answer: String(1 / x), solution: `1 ÷ ${par(x)} = ${fr(1 / x)}.` };
  }),
  ex("2de", "2-fonctions", "2-antecedents-carre", "Antécédents par la fonction carré", (r) => {
    const s = r.int(1, 12);
    return { prompt: `Combien de nombres ont pour carré ${s * s} ? Donne le plus petit.`, kind: "number", answer: String(-s), solution: `x² = ${s * s} ⇔ x = ${s} ou x = −${s}.` };
  }),
  ex("2de", "2-affines", "2-droite-ordonnee", "Ordonnée à l'origine d'une droite", (r) => {
    const a = r.nz(-5, 5);
    const b = r.int(-10, 10);
    const x1 = r.int(-5, 5);
    return { prompt: `La droite de coefficient directeur ${fr(a)} passe par (${fr(x1)} ; ${fr(a * x1 + b)}). Son ordonnée à l'origine ?`, kind: "number", answer: String(b), solution: `b = ${fr(a * x1 + b)} − ${par(a)} × ${par(x1)} = ${fr(b)}.` };
  }),
  ex("2de", "2-affines", "2-droite-deux-points", "Équation d'une droite par deux points", (r) => {
    const a = r.nz(-4, 4);
    const b = r.int(-8, 8);
    const x1 = r.int(-5, 0);
    const x2 = x1 + r.int(1, 4);
    return { prompt: `Équation réduite de la droite passant par A(${fr(x1)} ; ${fr(a * x1 + b)}) et B(${fr(x2)} ; ${fr(a * x2 + b)}) : y = ?`, kind: "expr", answer: lin(a, b), solution: `m = ${fr(a)}, p = ${fr(b)} : y = ${linShow(a, b)}.` };
  }),
  ex("2de", "2-vecteurs", "2-vecteur-coord", "Coordonnées d'un vecteur", (r) => {
    const xa = r.int(-9, 9);
    const xb = r.int(-9, 9);
    const ya = r.int(-9, 9);
    const yb = r.int(-9, 9);
    return { prompt: `A(${fr(xa)} ; ${fr(ya)}) et B(${fr(xb)} ; ${fr(yb)}). Abscisse du vecteur AB ?`, kind: "number", answer: String(xb - xa), solution: `xB − xA = ${fr(xb)} − ${par(xa)} = ${fr(xb - xa)} (ordonnée : ${fr(yb - ya)}).` };
  }),
  ex("2de", "2-vecteurs", "2-milieu", "Milieu d'un segment", (r) => {
    const xa = r.int(-9, 9);
    const xb = r.int(-9, 9);
    return { prompt: `A a pour abscisse ${fr(xa)}, B a pour abscisse ${fr(xb)}. Abscisse du milieu de [AB] ?`, kind: "number", answer: String((xa + xb) / 2), solution: `(${fr(xa)} + ${par(xb)}) ÷ 2 = ${fr((xa + xb) / 2)}.` };
  }),
  ex("2de", "2-vecteurs", "2-distance", "Distance entre deux points", (r) => {
    const [a, b, c] = r.pick(PYTHA);
    const xa = r.int(-5, 5);
    const ya = r.int(-5, 5);
    return { prompt: `A(${fr(xa)} ; ${fr(ya)}) et B(${fr(xa + a)} ; ${fr(ya + b)}). Distance AB ?`, kind: "number", answer: String(c), solution: `√(${a}² + ${b}²) = √${a * a + b * b} = ${c}.` };
  }),
  ex("2de", "2-vecteurs", "2-colineaires", "Vecteurs colinéaires", (r) => {
    const a = r.nz(-6, 6);
    const b = r.nz(-6, 6);
    const k = r.nz(-3, 3);
    const ok = r.next() < 0.5;
    const d = ok ? k * b : k * b + 1;
    return { prompt: `u(${fr(a)} ; ${fr(b)}) et v(${fr(k * a)} ; ${fr(d)}) sont-ils colinéaires ?`, kind: "choice", choices: ["Oui", "Non"], answer: ok ? "Oui" : "Non", solution: `det = ${fr(a)} × ${par(d)} − ${par(b)} × ${par(k * a)} = ${fr(a * d - b * k * a)} : ${ok ? "nul, colinéaires" : "non nul, non colinéaires"}.` };
  }),
  ex("2de", "2-pourcentages", "2-coef-multiplicateur", "Coefficient multiplicateur", (r) => {
    const t = r.pick([-50, -30, -20, -15, -10, -5, 2, 5, 10, 12, 20, 25, 50]);
    return { prompt: `Coefficient multiplicateur associé à une évolution de ${t > 0 ? "+" : ""}${t} % ?`, kind: "number", answer: String(1 + t / 100), solution: `1 ${t < 0 ? "−" : "+"} ${Math.abs(t)}/100 = ${fr(1 + t / 100)}.` };
  }),
  ex("2de", "2-pourcentages", "2-evolutions-successives", "Évolutions successives", (r) => {
    const t1 = r.pick([10, 20, 25, 50, -10, -20]);
    const t2 = r.pick([10, 20, -10, -20, -25, 5]);
    const g = ((1 + t1 / 100) * (1 + t2 / 100) - 1) * 100;
    return { prompt: `Une hausse ou baisse de ${t1 > 0 ? "+" : ""}${t1} % suivie de ${t2 > 0 ? "+" : ""}${t2} %. Évolution globale en % ?`, kind: "number", unit: "%", answer: String(r2(g)), solution: `${fr(1 + t1 / 100)} × ${fr(1 + t2 / 100)} = ${fr(r2(1 + g / 100), 4)}, soit ${fr(r2(g))} %.` };
  }),
  ex("2de", "2-pourcentages", "2-taux", "Taux d'évolution", (r) => {
    const v1 = r.int(2, 40) * 10;
    const t = r.pick([-40, -25, -20, -10, 5, 10, 15, 20, 30, 50]);
    const v2 = (v1 * (100 + t)) / 100;
    return { prompt: `Un prix passe de ${fr(v1)} € à ${fr(v2)} €. Taux d'évolution en % ?`, kind: "number", unit: "%", answer: String(t), solution: `(${fr(v2)} − ${fr(v1)}) ÷ ${fr(v1)} × 100 = ${t} %.` };
  }),
  ex("2de", "2-statistiques", "2-quartile", "Premier quartile", (r) => {
    const n = r.pick([8, 10, 12, 11, 9]);
    const xs = Array.from({ length: n }, () => r.int(0, 20)).sort((a, b) => a - b);
    const q1 = xs[Math.ceil(n / 4) - 1];
    return { prompt: `Série : ${r.shuffle(xs).join(" ; ")}. Premier quartile Q1 ?`, kind: "number", answer: String(q1), solution: `Série rangée : ${xs.join(" ; ")}. Rang ⌈${n}/4⌉ = ${Math.ceil(n / 4)} : Q1 = ${q1}.` };
  }),
  ex("2de", "2-statistiques", "2-proba-union", "Probabilité de A ou B", (r) => {
    const pa = r.int(1, 6) / 10;
    const pb = r.int(1, 6) / 10;
    const pab = r.int(0, Math.min(pa, pb) * 10) / 10;
    return { prompt: `P(A) = ${fr(pa)}, P(B) = ${fr(pb)}, P(A et B) = ${fr(pab)}. P(A ou B) ?`, kind: "number", answer: String(r2(pa + pb - pab)), solution: `${fr(pa)} + ${fr(pb)} − ${fr(pab)} = ${fr(r2(pa + pb - pab))}.` };
  }),
];
