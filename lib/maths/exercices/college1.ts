import { type Exercise, type Level, fr, frac, gcd, lcm, par, showFrac } from "../core";

const ex = (level: Level, chapter: string, id: string, title: string, make: Exercise["make"]): Exercise => ({
  id,
  level,
  chapter,
  title,
  make,
});
const r2 = (n: number) => Math.round(n * 100) / 100;

/** 6e et 5e. */
export const COLLEGE_1: Exercise[] = [
  // ── 6e : nombres ──
  ex("6e", "6-entiers", "6-chiffre-rang", "Chiffre d'un rang donné", (r) => {
    const n = r.dec(100, 9999, 3);
    const rang = r.pick(["dizaines", "dixièmes", "centièmes", "centaines"] as const);
    const s = n.toFixed(3);
    const [ent, dec] = s.split(".");
    const digit =
      rang === "dizaines" ? ent.at(-2) : rang === "centaines" ? ent.at(-3) : rang === "dixièmes" ? dec[0] : dec[1];
    return { prompt: `Quel est le chiffre des ${rang} dans ${fr(n, 3)} ?`, kind: "number", answer: digit ?? "0", solution: `Dans ${fr(n, 3)}, le chiffre des ${rang} est ${digit ?? 0}.` };
  }),
  ex("6e", "6-entiers", "6-encadrer", "Encadrer à l'unité", (r) => {
    const n = r.dec(1, 99, 2);
    return { prompt: `Quel entier est juste en dessous de ${fr(n)} (encadrement à l'unité) ?`, kind: "number", answer: String(Math.floor(n)), solution: `${Math.floor(n)} < ${fr(n)} < ${Math.floor(n) + 1}.` };
  }),
  ex("6e", "6-entiers", "6-arrondi-dixieme", "Arrondir au dixième", (r) => {
    const n = r.dec(1, 99, 3);
    const a = Math.round(n * 10) / 10;
    return { prompt: `Arrondis ${fr(n, 3)} au dixième.`, kind: "number", answer: String(a), solution: `On regarde le chiffre des centièmes : ${fr(a)}.` };
  }),
  ex("6e", "6-entiers", "6-dec-fraction", "Fraction décimale", (r) => {
    const n = r.dec(0.01, 9.99, 2);
    return { prompt: `${fr(n)} = …/100`, kind: "number", answer: String(Math.round(n * 100)), solution: `${fr(n)} = ${Math.round(n * 100)}/100.` };
  }),
  ex("6e", "6-operations", "6-add-dec", "Additionner des décimaux", (r) => {
    const a = r.dec(1, 200, 2);
    const b = r.dec(1, 200, 3);
    return { prompt: `${fr(a)} + ${fr(b)} = ?`, kind: "number", answer: String(Math.round((a + b) * 1000) / 1000), solution: `${fr(a + b, 3)}.` };
  }),
  ex("6e", "6-operations", "6-sous-dec", "Soustraire des décimaux", (r) => {
    const a = r.dec(50, 300, 2);
    const b = r.dec(1, 49, 2);
    return { prompt: `${fr(a)} − ${fr(b)} = ?`, kind: "number", answer: String(r2(a - b)), solution: `${fr(r2(a - b))}.` };
  }),
  ex("6e", "6-operations", "6-mult-dec", "Multiplier deux décimaux", (r) => {
    const a = r.dec(0.2, 9.9, 1);
    const b = r.dec(0.2, 9.9, 1);
    return { prompt: `${fr(a)} × ${fr(b)} = ?`, kind: "number", answer: String(r2(a * b)), solution: `${fr(a * 10)} × ${fr(b * 10)} = ${fr(Math.round(a * b * 100))}, puis on place 2 chiffres après la virgule : ${fr(r2(a * b))}.` };
  }),
  ex("6e", "6-operations", "6-mult-0-1", "Multiplier par 0,1 ; 0,01", (r) => {
    const a = r.int(3, 9999);
    const k = r.pick([0.1, 0.01, 0.001]);
    return { prompt: `${fr(a)} × ${fr(k)} = ?`, kind: "number", answer: String(Math.round(a * k * 1000) / 1000), solution: `Multiplier par ${fr(k)}, c'est diviser par ${fr(1 / k)} : ${fr(a * k, 3)}.` };
  }),
  ex("6e", "6-operations", "6-calcul-mental", "Calcul mental astucieux", (r) => {
    const a = r.pick([25, 50, 125]);
    const b = a === 25 ? 4 : a === 50 ? 2 : 8;
    const c = r.int(3, 99);
    return { prompt: `${a} × ${c} × ${b} = ?`, kind: "number", answer: String(a * b * c), solution: `${a} × ${b} = ${a * b}, puis ${a * b} × ${c} = ${fr(a * b * c)}.` };
  }),
  ex("6e", "6-division", "6-div-eucl", "Division euclidienne", (r) => {
    const b = r.int(7, 45);
    const q = r.int(12, 250);
    const rr = r.int(0, b - 1);
    return { prompt: `Dans la division euclidienne de ${fr(b * q + rr)} par ${b}, quel est le reste ?`, kind: "number", answer: String(rr), solution: `${fr(b * q + rr)} = ${b} × ${q} + ${rr}, avec ${rr} < ${b}.` };
  }),
  ex("6e", "6-division", "6-div-dec", "Division décimale", (r) => {
    const b = r.pick([2, 4, 5, 8]);
    const a = r.int(11, 99);
    return { prompt: `${a} ÷ ${b} = ? (valeur exacte)`, kind: "number", answer: String(a / b), solution: `${a} ÷ ${b} = ${fr(a / b)}.` };
  }),
  ex("6e", "6-division", "6-multiples", "Multiples et divisibilité", (r) => {
    const d = r.pick([2, 3, 5, 9, 10]);
    const n = r.int(100, 9999);
    const yes = n % d === 0;
    return { prompt: `${fr(n)} est-il divisible par ${d} ?`, kind: "choice", choices: ["Oui", "Non"], answer: yes ? "Oui" : "Non", solution: yes ? `Oui : ${fr(n)} = ${d} × ${n / d}.` : `Non : ${fr(n)} = ${d} × ${Math.floor(n / d)} + ${n % d}.` };
  }),
  ex("6e", "6-fractions", "6-frac-quotient", "Fraction et quotient", (r) => {
    const d = r.pick([2, 4, 5, 10, 20, 25]);
    const n = r.int(1, 3 * d);
    return { prompt: `Écris ${n}/${d} sous forme décimale.`, kind: "number", answer: String(n / d), solution: `${n} ÷ ${d} = ${fr(n / d)}.` };
  }),
  ex("6e", "6-fractions", "6-frac-de", "Prendre une fraction d'une quantité", (r) => {
    const d = r.pick([3, 4, 5, 6, 8]);
    const n = r.int(1, d - 1);
    const q = d * r.int(3, 25);
    return { prompt: `Calcule ${n}/${d} de ${q}.`, kind: "number", answer: String((q / d) * n), solution: `(${q} ÷ ${d}) × ${n} = ${(q / d) * n}.` };
  }),
  ex("6e", "6-fractions", "6-frac-egalite", "Égalités de fractions", (r) => {
    const d = r.int(3, 9);
    const n = r.int(1, d - 1);
    const k = r.int(2, 9);
    return { prompt: `${n}/${d} = ${n * k}/…`, kind: "number", answer: String(d * k), solution: `On a multiplié le numérateur par ${k}, on fait de même pour le dénominateur : ${d * k}.` };
  }),
  ex("6e", "6-fractions", "6-simplifier", "Simplifier une fraction", (r) => {
    const d = r.int(2, 12);
    const n = r.int(1, 3 * d);
    const k = r.int(2, 9);
    return { prompt: `Simplifie ${n * k}/${d * k} au maximum.`, kind: "fraction", answer: frac(n * k, d * k), solution: `On divise par ${gcd(n * k, d * k)} : ${showFrac(n * k, d * k)}.` };
  }),
  ex("6e", "6-proportionnalite", "6-prop-tableau", "Quatrième proportionnelle", (r) => {
    const a = r.int(2, 9);
    const k = r.int(2, 12);
    const c = r.int(2, 15);
    return { prompt: `${a} kg de pommes coûtent ${fr(a * k)} €. Combien coûtent ${c} kg ?`, kind: "number", unit: "€", answer: String(c * k), solution: `1 kg coûte ${k} €, donc ${c} kg coûtent ${fr(c * k)} €.` };
  }),
  ex("6e", "6-proportionnalite", "6-pourcent", "Appliquer un pourcentage", (r) => {
    const p = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 75]);
    const q = r.int(2, 40) * 20;
    return { prompt: `Calcule ${p} % de ${fr(q)}.`, kind: "number", answer: String((q * p) / 100), solution: `${fr(q)} × ${p} ÷ 100 = ${fr((q * p) / 100)}.` };
  }),
  ex("6e", "6-proportionnalite", "6-coef", "Coefficient de proportionnalité", (r) => {
    const k = r.dec(1.5, 9, 1);
    const a = r.int(2, 9);
    return { prompt: `Dans un tableau de proportionnalité, ${a} correspond à ${fr(a * k)}. Quel est le coefficient ?`, kind: "number", answer: String(k), solution: `${fr(a * k)} ÷ ${a} = ${fr(k)}.` };
  }),
  ex("6e", "6-grandeurs", "6-conv-longueur", "Convertir des longueurs", (r) => {
    const units = ["km", "hm", "dam", "m", "dm", "cm", "mm"];
    const i = r.int(0, 4);
    const j = r.int(i + 1, Math.min(6, i + 3));
    const v = r.dec(0.1, 99, 2);
    const res = v * 10 ** (j - i);
    return { prompt: `${fr(v)} ${units[i]} = … ${units[j]}`, kind: "number", unit: units[j], answer: String(Math.round(res * 1000) / 1000), solution: `On décale la virgule de ${j - i} rang(s) vers la droite : ${fr(res, 3)} ${units[j]}.` };
  }),
  ex("6e", "6-grandeurs", "6-conv-masse", "Convertir des masses", (r) => {
    const v = r.int(150, 9500);
    return { prompt: `${fr(v)} g = … kg`, kind: "number", unit: "kg", answer: String(v / 1000), solution: `1 kg = 1 000 g : ${fr(v / 1000)} kg.` };
  }),
  ex("6e", "6-grandeurs", "6-conv-duree", "Durées : heures et minutes", (r) => {
    const m = r.int(70, 400);
    return { prompt: `${m} min = … h … min. Combien d'heures entières ?`, kind: "number", unit: "h", answer: String(Math.floor(m / 60)), solution: `${m} = 60 × ${Math.floor(m / 60)} + ${m % 60} : ${Math.floor(m / 60)} h ${m % 60} min.` };
  }),
  ex("6e", "6-grandeurs", "6-duree-decimale", "Heures décimales", (r) => {
    const h = r.pick([0.25, 0.5, 0.75, 1.5, 2.25, 1.75]);
    return { prompt: `${fr(h)} h = … min`, kind: "number", unit: "min", answer: String(h * 60), solution: `${fr(h)} × 60 = ${h * 60} min.` };
  }),
  ex("6e", "6-perimetres-aires", "6-perimetre-cercle", "Périmètre d'un cercle", (r) => {
    const rr = r.int(2, 15);
    const p = 2 * Math.PI * rr;
    return { prompt: `Périmètre d'un cercle de rayon ${rr} cm, arrondi au dixième ?`, kind: "number", unit: "cm", tolerance: 0.051, answer: String(Math.round(p * 10) / 10), solution: `2 × π × ${rr} ≈ ${fr(Math.round(p * 10) / 10)} cm.` };
  }),
  ex("6e", "6-perimetres-aires", "6-aire-carre-rect", "Aire du carré et du rectangle", (r) => {
    const L = r.dec(2, 15, 1);
    const l = r.dec(1, 10, 1);
    return { prompt: `Aire d'un rectangle de ${fr(L)} m sur ${fr(l)} m ?`, kind: "number", unit: "m²", answer: String(r2(L * l)), solution: `${fr(L)} × ${fr(l)} = ${fr(r2(L * l))} m².` };
  }),
  ex("6e", "6-perimetres-aires", "6-aire-triangle-rect", "Aire du triangle rectangle", (r) => {
    const a = r.int(2, 20);
    const b = r.int(2, 20);
    return { prompt: `Un triangle rectangle a des côtés de l'angle droit de ${a} cm et ${b} cm. Son aire ?`, kind: "number", unit: "cm²", answer: String((a * b) / 2), solution: `(${a} × ${b}) ÷ 2 = ${fr((a * b) / 2)} cm².` };
  }),
  ex("6e", "6-perimetres-aires", "6-conv-aires", "Convertir des aires", (r) => {
    const v = r.dec(0.5, 50, 1);
    const [a, b, k] = r.pick([["m²", "dm²", 100], ["m²", "cm²", 10000], ["dm²", "cm²", 100], ["km²", "ha", 100], ["ha", "m²", 10000]] as const);
    return { prompt: `${fr(v)} ${a} = … ${b}`, kind: "number", unit: b, answer: String(Math.round(v * k * 100) / 100), solution: `1 ${a} = ${fr(k)} ${b} : ${fr(v * k)} ${b}.` };
  }),
  ex("6e", "6-angles", "6-angle-complementaire", "Angles qui se complètent", (r) => {
    const a = r.int(10, 170);
    const plat = r.next() < 0.5;
    const total = plat ? 180 : 90;
    const x = plat ? a : r.int(5, 85);
    return { prompt: plat ? `Deux angles forment un angle plat. L'un mesure ${x}°. Combien mesure l'autre ?` : `Deux angles forment un angle droit. L'un mesure ${x}°. Combien mesure l'autre ?`, kind: "number", unit: "°", answer: String(total - x), solution: `${total} − ${x} = ${total - x}°.` };
  }),
  ex("6e", "6-angles", "6-nature-angle", "Nature d'un angle", (r) => {
    const a = r.pick([r.int(5, 85), 90, r.int(95, 175), 180]);
    const n = a < 90 ? "aigu" : a === 90 ? "droit" : a < 180 ? "obtus" : "plat";
    return { prompt: `Un angle de ${a}° est…`, kind: "choice", choices: ["aigu", "droit", "obtus", "plat"], answer: n, solution: `${a}° : angle ${n}.` };
  }),
  ex("6e", "6-volumes", "6-volume-pave", "Volume du pavé droit", (r) => {
    const a = r.int(2, 12);
    const b = r.int(2, 12);
    const c = r.int(2, 12);
    return { prompt: `Volume d'un pavé droit de ${a} cm × ${b} cm × ${c} cm ?`, kind: "number", unit: "cm³", answer: String(a * b * c), solution: `${a} × ${b} × ${c} = ${a * b * c} cm³.` };
  }),
  ex("6e", "6-volumes", "6-litres", "Volumes et litres", (r) => {
    const v = r.dec(0.5, 20, 1);
    return { prompt: `${fr(v)} dm³ = … L`, kind: "number", unit: "L", answer: String(v), solution: `1 dm³ = 1 L.` };
  }),

  // ── 5e ──
  ex("5e", "5-priorites", "5-priorites-simple", "Priorités : multiplication avant addition", (r) => {
    const a = r.int(2, 30);
    const b = r.int(2, 12);
    const c = r.int(2, 12);
    return { prompt: `${a} + ${b} × ${c} = ?`, kind: "number", answer: String(a + b * c), solution: `On multiplie d'abord : ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}.` };
  }),
  ex("5e", "5-priorites", "5-priorites-parentheses", "Priorités avec parenthèses", (r) => {
    const a = r.int(2, 12);
    const b = r.int(2, 20);
    const c = r.int(2, 20);
    const d = r.int(1, 30);
    return { prompt: `${a} × (${b} + ${c}) − ${d} = ?`, kind: "number", answer: String(a * (b + c) - d), solution: `${a} × ${b + c} − ${d} = ${a * (b + c)} − ${d} = ${a * (b + c) - d}.` };
  }),
  ex("5e", "5-priorites", "5-priorites-division", "Priorités : division", (r) => {
    const b = r.int(2, 9);
    const q = r.int(2, 12);
    const a = r.int(5, 50);
    return { prompt: `${a} − ${b * q} ÷ ${b} = ?`, kind: "number", answer: String(a - q), solution: `${b * q} ÷ ${b} = ${q}, puis ${a} − ${q} = ${a - q}.` };
  }),
  ex("5e", "5-relatifs", "5-rel-add", "Additionner des relatifs", (r) => {
    const a = r.nz(-30, 30);
    const b = r.nz(-30, 30);
    return { prompt: `${par(a)} + ${par(b)} = ?`, kind: "number", answer: String(a + b), solution: `${par(a)} + ${par(b)} = ${fr(a + b)}.` };
  }),
  ex("5e", "5-relatifs", "5-rel-sous", "Soustraire des relatifs", (r) => {
    const a = r.nz(-30, 30);
    const b = r.nz(-30, 30);
    return { prompt: `${par(a)} − ${par(b)} = ?`, kind: "number", answer: String(a - b), solution: `Soustraire ${par(b)}, c'est ajouter ${par(-b)} : ${fr(a - b)}.` };
  }),
  ex("5e", "5-relatifs", "5-rel-suite", "Suite d'additions de relatifs", (r) => {
    const xs = [r.nz(-15, 15), r.nz(-15, 15), r.nz(-15, 15), r.nz(-15, 15)];
    return { prompt: `${xs.map(par).join(" + ")} = ?`, kind: "number", answer: String(xs.reduce((a, b) => a + b, 0)), solution: `On regroupe les positifs et les négatifs : ${fr(xs.reduce((a, b) => a + b, 0))}.` };
  }),
  ex("5e", "5-relatifs", "5-rel-distance", "Écart de températures", (r) => {
    const a = r.int(-15, 5);
    const b = r.int(a + 3, 25);
    return { prompt: `Le matin il fait ${fr(a)} °C, l'après-midi ${fr(b)} °C. De combien de degrés la température a-t-elle monté ?`, kind: "number", unit: "°C", answer: String(b - a), solution: `${fr(b)} − ${par(a)} = ${b - a} °C.` };
  }),
  ex("5e", "5-fractions", "5-frac-meme-denom", "Additionner des fractions (même dénominateur)", (r) => {
    const d = r.int(3, 12);
    const a = r.int(1, d);
    const b = r.int(1, d);
    return { prompt: `${a}/${d} + ${b}/${d} = ? (forme simplifiée)`, kind: "fraction", answer: frac(a + b, d), solution: `${a + b}/${d} = ${showFrac(a + b, d)}.` };
  }),
  ex("5e", "5-fractions", "5-frac-multiple", "Additionner des fractions (dénominateur multiple)", (r) => {
    const d = r.int(2, 6);
    const k = r.int(2, 4);
    const a = r.int(1, d);
    const b = r.int(1, d * k);
    return { prompt: `${a}/${d} + ${b}/${d * k} = ? (forme simplifiée)`, kind: "fraction", answer: frac(a * k + b, d * k), solution: `${a}/${d} = ${a * k}/${d * k}, donc ${a * k + b}/${d * k} = ${showFrac(a * k + b, d * k)}.` };
  }),
  ex("5e", "5-fractions", "5-frac-comparer", "Comparer des fractions", (r) => {
    const d = r.int(3, 9);
    const k = r.int(2, 4);
    const a = r.int(1, 2 * d);
    let b = r.int(1, 2 * d * k);
    if (a * k === b) b += 1;
    const big = a * k > b ? `${a}/${d}` : `${b}/${d * k}`;
    return { prompt: `Quelle est la plus grande fraction : ${a}/${d} ou ${b}/${d * k} ?`, kind: "choice", choices: [`${a}/${d}`, `${b}/${d * k}`], answer: big, solution: `${a}/${d} = ${a * k}/${d * k}, on compare ${a * k} et ${b}.` };
  }),
  ex("5e", "5-litteral", "5-substituer", "Calculer une expression pour une valeur", (r) => {
    const a = r.int(2, 9);
    const b = r.int(-10, 10);
    const x = r.int(-5, 8);
    return { prompt: `Calcule ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} pour x = ${fr(x)}.`, kind: "number", answer: String(a * x + b), solution: `${a} × ${par(x)} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${a * x + b}.` };
  }),
  ex("5e", "5-litteral", "5-reduire", "Réduire une expression", (r) => {
    const a = r.nz(-9, 9);
    const b = r.nz(-9, 9);
    const c = r.nz(-9, 9);
    return { prompt: `Réduis : ${a}x + ${par(b)} + ${par(c)}x`, kind: "expr", form: "developpee", answer: `${a + c}x+${b}`, solution: `On regroupe les x : (${a} + ${par(c)})x = ${a + c}x, donc ${a + c}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}.` };
  }),
  ex("5e", "5-litteral", "5-perimetre-litteral", "Périmètre en fonction de x", (r) => {
    const a = r.int(1, 9);
    return { prompt: `Un rectangle a pour longueur x + ${a} et pour largeur x. Écris son périmètre en fonction de x (forme réduite).`, kind: "expr", form: "developpee", answer: `4x+${2 * a}`, solution: `2 × (x + ${a} + x) = 4x + ${2 * a}.` };
  }),
  ex("5e", "5-litteral", "5-distributivite-simple", "Distributivité simple", (r) => {
    const k = r.int(2, 9);
    const a = r.nz(-9, 9);
    return { prompt: `Développe : ${k}(x ${a < 0 ? "−" : "+"} ${Math.abs(a)})`, kind: "expr", form: "developpee", answer: `${k}x+${k * a}`, solution: `${k} × x + ${k} × ${par(a)} = ${k}x ${k * a < 0 ? "−" : "+"} ${Math.abs(k * a)}.` };
  }),
  ex("5e", "5-proportionnalite", "5-echelle", "Échelles", (r) => {
    const e = r.pick([1000, 2000, 5000, 10000, 25000, 50000, 100000]);
    const cm = r.dec(1, 15, 1);
    const real = (cm * e) / 100;
    return { prompt: `Sur une carte à l'échelle 1/${fr(e)}, deux villes sont à ${fr(cm)} cm. Distance réelle en mètres ?`, kind: "number", unit: "m", answer: String(Math.round(real * 100) / 100), solution: `${fr(cm)} × ${fr(e)} = ${fr(cm * e)} cm = ${fr(real)} m.` };
  }),
  ex("5e", "5-proportionnalite", "5-reduction", "Prix après réduction", (r) => {
    const p = r.int(2, 40) * 5;
    const t = r.pick([10, 20, 25, 30, 40, 50]);
    return { prompt: `Un article coûte ${fr(p)} €. Il est soldé à −${t} %. Nouveau prix ?`, kind: "number", unit: "€", answer: String((p * (100 - t)) / 100), solution: `Réduction : ${fr((p * t) / 100)} €. Prix : ${fr(p)} − ${fr((p * t) / 100)} = ${fr((p * (100 - t)) / 100)} €.` };
  }),
  ex("5e", "5-proportionnalite", "5-ratio", "Partage selon un ratio", (r) => {
    const a = r.int(1, 5);
    const b = r.int(1, 5);
    const k = r.int(2, 20);
    return { prompt: `On partage ${(a + b) * k} € dans le ratio ${a} : ${b}. Combien reçoit la première personne ?`, kind: "number", unit: "€", answer: String(a * k), solution: `${a + b} parts de ${k} € : la première reçoit ${a} × ${k} = ${a * k} €.` };
  }),
  ex("5e", "5-triangles", "5-somme-angles", "Somme des angles du triangle", (r) => {
    const a = r.int(20, 100);
    const b = r.int(20, 160 - a - 5);
    return { prompt: `Dans un triangle, deux angles mesurent ${a}° et ${b}°. Mesure du troisième ?`, kind: "number", unit: "°", answer: String(180 - a - b), solution: `180 − ${a} − ${b} = ${180 - a - b}°.` };
  }),
  ex("5e", "5-triangles", "5-isocele", "Triangle isocèle", (r) => {
    const s = r.int(20, 140);
    return { prompt: `Un triangle est isocèle ; l'angle au sommet principal mesure ${s}°. Mesure de chaque angle à la base ?`, kind: "number", unit: "°", answer: String((180 - s) / 2), solution: `(180 − ${s}) ÷ 2 = ${fr((180 - s) / 2)}°.` };
  }),
  ex("5e", "5-triangles", "5-inegalite", "Inégalité triangulaire", (r) => {
    const a = r.int(2, 12);
    const b = r.int(2, 12);
    const c = r.int(1, 25);
    const ok = c < a + b && a < b + c && b < a + c;
    return { prompt: `Peut-on construire un triangle de côtés ${a} cm, ${b} cm et ${c} cm ?`, kind: "choice", choices: ["Oui", "Non"], answer: ok ? "Oui" : "Non", solution: ok ? "Oui : chaque côté est plus petit que la somme des deux autres." : "Non : le plus grand côté dépasse (ou égale) la somme des deux autres." };
  }),
  ex("5e", "5-aires", "5-aire-triangle", "Aire d'un triangle", (r) => {
    const b = r.int(3, 20);
    const h = r.int(2, 15);
    return { prompt: `Aire d'un triangle de base ${b} cm et de hauteur ${h} cm ?`, kind: "number", unit: "cm²", answer: String((b * h) / 2), solution: `(${b} × ${h}) ÷ 2 = ${fr((b * h) / 2)} cm².` };
  }),
  ex("5e", "5-aires", "5-aire-parallelogramme", "Aire d'un parallélogramme", (r) => {
    const b = r.int(3, 20);
    const h = r.int(2, 15);
    return { prompt: `Aire d'un parallélogramme de base ${b} m et de hauteur ${h} m ?`, kind: "number", unit: "m²", answer: String(b * h), solution: `${b} × ${h} = ${b * h} m².` };
  }),
  ex("5e", "5-aires", "5-aire-disque", "Aire d'un disque", (r) => {
    const rr = r.int(1, 12);
    const a = Math.PI * rr * rr;
    return { prompt: `Aire d'un disque de rayon ${rr} cm, arrondie au dixième ?`, kind: "number", unit: "cm²", tolerance: 0.051, answer: String(Math.round(a * 10) / 10), solution: `π × ${rr}² ≈ ${fr(Math.round(a * 10) / 10)} cm².` };
  }),
  ex("5e", "5-statistiques", "5-moyenne", "Calculer une moyenne", (r) => {
    const n = r.int(4, 6);
    const xs = Array.from({ length: n }, () => r.int(5, 20));
    const s = xs.reduce((a, b) => a + b, 0);
    return { prompt: `Notes : ${xs.join(" ; ")}. Moyenne, arrondie au dixième ?`, kind: "number", tolerance: 0.051, answer: String(Math.round((s / n) * 10) / 10), solution: `Somme ${s}, divisée par ${n} : ≈ ${fr(Math.round((s / n) * 10) / 10)}.` };
  }),
  ex("5e", "5-statistiques", "5-frequence", "Fréquence en pourcentage", (r) => {
    const total = r.pick([20, 25, 40, 50]);
    const e = r.int(1, total - 1);
    return { prompt: `Dans une classe de ${total} élèves, ${e} font du sport. Fréquence en % ?`, kind: "number", unit: "%", answer: String((e / total) * 100), solution: `${e} ÷ ${total} × 100 = ${fr((e / total) * 100)} %.` };
  }),
  ex("5e", "5-probabilites", "5-proba-de", "Probabilité avec un dé", (r) => {
    const evts = [
      { t: "obtenir un nombre pair", n: 3 },
      { t: "obtenir un 6", n: 1 },
      { t: "obtenir un multiple de 3", n: 2 },
      { t: "obtenir un nombre inférieur à 5", n: 4 },
      { t: "obtenir un nombre premier", n: 3 },
    ];
    const e = r.pick(evts);
    return { prompt: `On lance un dé équilibré à 6 faces. Probabilité de ${e.t} ? (fraction simplifiée)`, kind: "fraction", answer: frac(e.n, 6), solution: `${e.n} issues favorables sur 6 : ${showFrac(e.n, 6)}.` };
  }),
  ex("5e", "5-probabilites", "5-proba-urne", "Probabilité dans une urne", (r) => {
    const rouge = r.int(1, 9);
    const bleu = r.int(1, 9);
    const vert = r.int(0, 6);
    const tot = rouge + bleu + vert;
    return { prompt: `Une urne contient ${rouge} boules rouges, ${bleu} bleues et ${vert} vertes. On tire une boule. Probabilité qu'elle soit rouge ?`, kind: "fraction", answer: frac(rouge, tot), solution: `${rouge} / ${tot} = ${showFrac(rouge, tot)}.` };
  }),
  ex("5e", "5-fractions", "5-ppcm", "Dénominateur commun", (r) => {
    const a = r.pick([4, 6, 8, 9, 10, 12]);
    const b = r.pick([3, 4, 6, 15, 8]);
    return { prompt: `Plus petit dénominateur commun à ${a} et ${b} ?`, kind: "number", answer: String(lcm(a, b)), solution: `Le plus petit multiple commun de ${a} et ${b} est ${lcm(a, b)}.` };
  }),
];
