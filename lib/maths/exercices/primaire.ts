import { type Exercise, type Level, fr, frac } from "../core";

const ex = (level: Level, chapter: string, id: string, title: string, make: Exercise["make"]): Exercise => ({
  id,
  level,
  chapter,
  title,
  make,
});

const PRENOMS = ["Léa", "Tom", "Inès", "Hugo", "Jade", "Nathan", "Chloé", "Lucas", "Manon", "Adam", "Zoé", "Noah"];
const FRUITS = ["pommes", "billes", "images", "bonbons", "crayons", "cartes", "perles", "timbres"];

export const PRIMAIRE: Exercise[] = [
  // ── CP ──
  ex("CP", "cp-nombres", "cp-suivant", "Le nombre qui suit", (r) => {
    const n = r.int(5, 98);
    return { prompt: `Quel nombre vient juste après ${n} ?`, kind: "number", answer: String(n + 1), solution: `Après ${n} vient ${n + 1}.` };
  }),
  ex("CP", "cp-nombres", "cp-precedent", "Le nombre qui précède", (r) => {
    const n = r.int(2, 99);
    return { prompt: `Quel nombre vient juste avant ${n} ?`, kind: "number", answer: String(n - 1), solution: `Avant ${n} vient ${n - 1}.` };
  }),
  ex("CP", "cp-nombres", "cp-dizaines", "Dizaines et unités", (r) => {
    const d = r.int(1, 9);
    const u = r.int(0, 9);
    return {
      prompt: `${d} dizaine${d > 1 ? "s" : ""} et ${u} unité${u > 1 ? "s" : ""}, c'est quel nombre ?`,
      kind: "number",
      answer: String(d * 10 + u),
      solution: `${d} dizaines = ${d * 10}, et ${d * 10} + ${u} = ${d * 10 + u}.`,
    };
  }),
  ex("CP", "cp-nombres", "cp-comparer", "Le plus grand nombre", (r) => {
    let a = r.int(10, 99);
    let b = r.int(10, 99);
    if (a === b) b = a + 1;
    [a, b] = r.next() < 0.5 ? [a, b] : [b, a];
    return { prompt: `Quel est le plus grand : ${a} ou ${b} ?`, kind: "choice", choices: [String(a), String(b)], answer: String(Math.max(a, b)), solution: `${Math.max(a, b)} > ${Math.min(a, b)}.` };
  }),
  ex("CP", "cp-additions", "cp-add-10", "Additions jusqu'à 10", (r) => {
    const a = r.int(0, 9);
    const b = r.int(0, 10 - a);
    return { prompt: `${a} + ${b} = ?`, kind: "number", answer: String(a + b), solution: `${a} + ${b} = ${a + b}.` };
  }),
  ex("CP", "cp-additions", "cp-add-20", "Additions jusqu'à 20", (r) => {
    const a = r.int(3, 15);
    const b = r.int(2, 20 - a);
    return { prompt: `${a} + ${b} = ?`, kind: "number", answer: String(a + b), solution: `${a} + ${b} = ${a + b}.` };
  }),
  ex("CP", "cp-additions", "cp-add-100", "Additions de dizaines", (r) => {
    const a = r.int(1, 8) * 10;
    const b = r.int(1, (100 - a) / 10) * 10;
    return { prompt: `${a} + ${b} = ?`, kind: "number", answer: String(a + b), solution: `${a / 10} dizaines + ${b / 10} dizaines = ${(a + b) / 10} dizaines = ${a + b}.` };
  }),
  ex("CP", "cp-additions", "cp-sous-20", "Soustractions jusqu'à 20", (r) => {
    const a = r.int(5, 20);
    const b = r.int(0, a);
    return { prompt: `${a} − ${b} = ?`, kind: "number", answer: String(a - b), solution: `${a} − ${b} = ${a - b}.` };
  }),
  ex("CP", "cp-additions", "cp-complement-10", "Compléments à 10", (r) => {
    const a = r.int(0, 10);
    return { prompt: `${a} + … = 10`, kind: "number", answer: String(10 - a), solution: `${a} + ${10 - a} = 10.` };
  }),
  ex("CP", "cp-problemes", "cp-pb-ajout", "Problème : on ajoute", (r) => {
    const p = r.pick(PRENOMS);
    const f = r.pick(FRUITS);
    const a = r.int(3, 30);
    const b = r.int(2, 20);
    return { prompt: `${p} a ${a} ${f}. On lui en donne ${b}. Combien en a-t-il maintenant ?`, kind: "number", answer: String(a + b), solution: `${a} + ${b} = ${a + b}.` };
  }),
  ex("CP", "cp-problemes", "cp-pb-retrait", "Problème : on enlève", (r) => {
    const p = r.pick(PRENOMS);
    const f = r.pick(FRUITS);
    const a = r.int(10, 40);
    const b = r.int(2, a - 1);
    return { prompt: `${p} a ${a} ${f}. Il en perd ${b}. Combien lui en reste-t-il ?`, kind: "number", answer: String(a - b), solution: `${a} − ${b} = ${a - b}.` };
  }),

  // ── CE1 ──
  ex("CE1", "ce1-nombres", "ce1-centaines", "Centaines, dizaines, unités", (r) => {
    const c = r.int(1, 9);
    const d = r.int(0, 9);
    const u = r.int(0, 9);
    return { prompt: `${c} centaines, ${d} dizaines et ${u} unités : quel nombre ?`, kind: "number", answer: String(c * 100 + d * 10 + u), solution: `${c * 100} + ${d * 10} + ${u} = ${c * 100 + d * 10 + u}.` };
  }),
  ex("CE1", "ce1-nombres", "ce1-chiffre-dizaines", "Chiffre des dizaines", (r) => {
    const n = r.int(100, 999);
    return { prompt: `Quel est le chiffre des dizaines de ${n} ?`, kind: "number", answer: String(Math.floor(n / 10) % 10), solution: `Dans ${n}, le chiffre des dizaines est ${Math.floor(n / 10) % 10}.` };
  }),
  ex("CE1", "ce1-nombres", "ce1-ordre", "Ranger des nombres", (r) => {
    const xs = r.shuffle([r.int(100, 300), r.int(301, 600), r.int(601, 999)]);
    const min = Math.min(...xs);
    return { prompt: `Quel est le plus petit nombre : ${xs.join(" ; ")} ?`, kind: "choice", choices: xs.map(String), answer: String(min), solution: `On compare les centaines : ${min} est le plus petit.` };
  }),
  ex("CE1", "ce1-calcul", "ce1-add-pose", "Additions à deux chiffres", (r) => {
    const a = r.int(15, 79);
    const b = r.int(12, 99 - (a % 10) * 0);
    return { prompt: `${a} + ${b} = ?`, kind: "number", answer: String(a + b), solution: `${a} + ${b} = ${a + b}.` };
  }),
  ex("CE1", "ce1-calcul", "ce1-sous-pose", "Soustractions à deux chiffres", (r) => {
    const a = r.int(40, 99);
    const b = r.int(11, a - 5);
    return { prompt: `${a} − ${b} = ?`, kind: "number", answer: String(a - b), solution: `${a} − ${b} = ${a - b}.` };
  }),
  ex("CE1", "ce1-calcul", "ce1-double-moitie", "Doubles et moitiés", (r) => {
    const n = r.int(2, 50) * 2;
    return r.next() < 0.5
      ? { prompt: `Quel est le double de ${n / 2} ?`, kind: "number", answer: String(n), solution: `${n / 2} + ${n / 2} = ${n}.` }
      : { prompt: `Quelle est la moitié de ${n} ?`, kind: "number", answer: String(n / 2), solution: `${n / 2} + ${n / 2} = ${n}, donc la moitié de ${n} est ${n / 2}.` };
  }),
  ex("CE1", "ce1-tables", "ce1-tables-2-5", "Tables de 2, 3, 4, 5 et 10", (r) => {
    const a = r.pick([2, 3, 4, 5, 10]);
    const b = r.int(1, 10);
    return { prompt: `${a} × ${b} = ?`, kind: "number", answer: String(a * b), solution: `${a} × ${b} = ${a * b}.` };
  }),
  ex("CE1", "ce1-mesures", "ce1-monnaie", "Rendre la monnaie", (r) => {
    const prix = r.int(3, 18);
    const billet = prix < 10 ? 10 : 20;
    return { prompt: `Un livre coûte ${prix} €. Je paie avec un billet de ${billet} €. Combien me rend-on ?`, kind: "number", unit: "€", answer: String(billet - prix), solution: `${billet} − ${prix} = ${billet - prix} €.` };
  }),
  ex("CE1", "ce1-mesures", "ce1-m-cm", "Mètres et centimètres", (r) => {
    const m = r.int(1, 5);
    return { prompt: `${m} m = … cm`, kind: "number", unit: "cm", answer: String(m * 100), solution: `1 m = 100 cm, donc ${m} m = ${m * 100} cm.` };
  }),
  ex("CE1", "ce1-mesures", "ce1-heures", "Durées en heures", (r) => {
    const d = r.int(7, 15);
    const l = r.int(1, 5);
    return { prompt: `Un film commence à ${d} h et dure ${l} h. À quelle heure finit-il ?`, kind: "number", unit: "h", answer: String(d + l), solution: `${d} + ${l} = ${d + l} h.` };
  }),

  // ── CE2 ──
  ex("CE2", "ce2-nombres", "ce2-milliers", "Écrire les nombres jusqu'à 10 000", (r) => {
    const m = r.int(1, 9);
    const c = r.int(0, 9);
    const d = r.int(0, 9);
    const u = r.int(0, 9);
    const n = m * 1000 + c * 100 + d * 10 + u;
    return { prompt: `${m} milliers, ${c} centaines, ${d} dizaines, ${u} unités : quel nombre ?`, kind: "number", answer: String(n), solution: `${fr(n)}.` };
  }),
  ex("CE2", "ce2-nombres", "ce2-arrondi", "Arrondir à la centaine", (r) => {
    const n = r.int(1010, 9890);
    const a = Math.round(n / 100) * 100;
    return { prompt: `Arrondis ${fr(n)} à la centaine la plus proche.`, kind: "number", answer: String(a), solution: `${fr(n)} est plus proche de ${fr(a)}.` };
  }),
  ex("CE2", "ce2-tables", "ce2-tables", "Tables de multiplication", (r) => {
    const a = r.int(2, 9);
    const b = r.int(2, 10);
    return { prompt: `${a} × ${b} = ?`, kind: "number", answer: String(a * b), solution: `${a} × ${b} = ${a * b}.` };
  }),
  ex("CE2", "ce2-tables", "ce2-tables-trou", "Tables : le facteur manquant", (r) => {
    const a = r.int(2, 9);
    const b = r.int(2, 10);
    return { prompt: `${a} × … = ${a * b}`, kind: "number", answer: String(b), solution: `${a} × ${b} = ${a * b}.` };
  }),
  ex("CE2", "ce2-calcul", "ce2-mult-pose", "Multiplier par un nombre à un chiffre", (r) => {
    const a = r.int(12, 299);
    const b = r.int(2, 9);
    return { prompt: `${a} × ${b} = ?`, kind: "number", answer: String(a * b), solution: `${a} × ${b} = ${fr(a * b)}.` };
  }),
  ex("CE2", "ce2-calcul", "ce2-mult-10-100", "Multiplier par 10, 100", (r) => {
    const a = r.int(3, 99);
    const k = r.pick([10, 100]);
    return { prompt: `${a} × ${k} = ?`, kind: "number", answer: String(a * k), solution: `On ajoute ${k === 10 ? "un zéro" : "deux zéros"} : ${fr(a * k)}.` };
  }),
  ex("CE2", "ce2-calcul", "ce2-partage", "Partager équitablement", (r) => {
    const n = r.int(2, 9);
    const q = r.int(3, 12);
    const f = r.pick(FRUITS);
    return { prompt: `On partage ${n * q} ${f} entre ${n} enfants. Combien chacun en reçoit-il ?`, kind: "number", answer: String(q), solution: `${n} × ${q} = ${n * q}, donc chacun reçoit ${q} ${f}.` };
  }),
  ex("CE2", "ce2-mesures", "ce2-km-m", "Kilomètres et mètres", (r) => {
    const km = r.int(1, 9);
    const m = r.int(0, 9) * 100;
    return { prompt: `${km} km ${m} m = … m`, kind: "number", unit: "m", answer: String(km * 1000 + m), solution: `1 km = 1 000 m, donc ${fr(km * 1000 + m)} m.` };
  }),
  ex("CE2", "ce2-mesures", "ce2-kg-g", "Kilogrammes et grammes", (r) => {
    const kg = r.int(1, 9);
    return { prompt: `${kg} kg = … g`, kind: "number", unit: "g", answer: String(kg * 1000), solution: `1 kg = 1 000 g, donc ${fr(kg * 1000)} g.` };
  }),
  ex("CE2", "ce2-mesures", "ce2-minutes", "Heures et minutes", (r) => {
    const h = r.int(1, 4);
    const m = r.int(0, 5) * 10;
    return { prompt: `${h} h ${m} min = … min`, kind: "number", unit: "min", answer: String(h * 60 + m), solution: `1 h = 60 min : ${h} × 60 + ${m} = ${h * 60 + m} min.` };
  }),
  ex("CE2", "ce2-problemes", "ce2-pb-mult", "Problème multiplicatif", (r) => {
    const n = r.int(3, 9);
    const p = r.int(4, 12);
    return { prompt: `Une boîte contient ${p} œufs. Combien d'œufs y a-t-il dans ${n} boîtes ?`, kind: "number", answer: String(n * p), solution: `${n} × ${p} = ${n * p}.` };
  }),
  ex("CE2", "ce2-problemes", "ce2-pb-deux-etapes", "Problème en deux étapes", (r) => {
    const a = r.int(20, 60);
    const b = r.int(5, 15);
    const c = r.int(5, 15);
    return { prompt: `Un bus transporte ${a} passagers. À l'arrêt, ${b} descendent et ${c} montent. Combien y a-t-il de passagers ?`, kind: "number", answer: String(a - b + c), solution: `${a} − ${b} + ${c} = ${a - b + c}.` };
  }),

  // ── CM1 ──
  ex("CM1", "cm1-nombres", "cm1-grands-nombres", "Lire les grands nombres", (r) => {
    const mi = r.int(1, 99);
    const k = r.int(0, 999);
    const u = r.int(0, 999);
    const n = mi * 1_000_000 + k * 1000 + u;
    return { prompt: `${mi} million${mi > 1 ? "s" : ""}, ${k} mille et ${u} : écris ce nombre en chiffres.`, kind: "number", answer: String(n), solution: `${fr(n)}.` };
  }),
  ex("CM1", "cm1-nombres", "cm1-classe-milliers", "Nombre de milliers", (r) => {
    const n = r.int(10_000, 999_999);
    return { prompt: `Combien y a-t-il de milliers en tout dans ${fr(n)} ?`, kind: "number", answer: String(Math.floor(n / 1000)), solution: `On regarde tout ce qui est à gauche des centaines : ${Math.floor(n / 1000)} milliers.` };
  }),
  ex("CM1", "cm1-fractions", "cm1-fraction-de", "Fraction d'une quantité", (r) => {
    const d = r.pick([2, 3, 4, 5, 10]);
    const n = r.int(1, d - 1);
    const q = d * r.int(2, 12);
    return { prompt: `Combien font ${n}/${d} de ${q} ?`, kind: "number", answer: String((q / d) * n), solution: `${q} ÷ ${d} = ${q / d}, puis ${q / d} × ${n} = ${(q / d) * n}.` };
  }),
  ex("CM1", "cm1-fractions", "cm1-fraction-unite", "Fractions et unité", (r) => {
    const d = r.pick([2, 3, 4, 5, 10]);
    return { prompt: `Combien de ${d === 2 ? "demis" : d === 3 ? "tiers" : d === 4 ? "quarts" : d === 5 ? "cinquièmes" : "dixièmes"} dans une unité ?`, kind: "number", answer: String(d), solution: `1 = ${d}/${d}.` };
  }),
  ex("CM1", "cm1-decimaux", "cm1-dixiemes", "Écriture décimale des dixièmes", (r) => {
    const n = r.int(11, 99);
    return { prompt: `Écris ${n}/10 sous forme décimale.`, kind: "number", answer: String(n / 10), solution: `${n}/10 = ${fr(n / 10)}.` };
  }),
  ex("CM1", "cm1-decimaux", "cm1-comparer-dec", "Comparer des décimaux", (r) => {
    const a = r.dec(1, 9, 2);
    let b = r.dec(1, 9, 1);
    if (a === b) b += 0.1;
    return { prompt: `Quel est le plus grand : ${fr(a)} ou ${fr(b)} ?`, kind: "choice", choices: [fr(a), fr(b)], answer: fr(Math.max(a, b)), solution: `${fr(Math.max(a, b))} > ${fr(Math.min(a, b))}.` };
  }),
  ex("CM1", "cm1-calcul", "cm1-mult-2", "Multiplier par un nombre à deux chiffres", (r) => {
    const a = r.int(21, 99);
    const b = r.int(11, 49);
    return { prompt: `${a} × ${b} = ?`, kind: "number", answer: String(a * b), solution: `${a} × ${b} = ${fr(a * b)}.` };
  }),
  ex("CM1", "cm1-calcul", "cm1-division", "Division (quotient)", (r) => {
    const b = r.int(3, 9);
    const q = r.int(12, 99);
    return { prompt: `${b * q} ÷ ${b} = ?`, kind: "number", answer: String(q), solution: `${b} × ${q} = ${b * q}.` };
  }),
  ex("CM1", "cm1-mesures", "cm1-perimetre-rect", "Périmètre du rectangle", (r) => {
    const L = r.int(5, 30);
    const l = r.int(2, L - 1);
    return { prompt: `Périmètre d'un rectangle de longueur ${L} cm et de largeur ${l} cm ?`, kind: "number", unit: "cm", answer: String(2 * (L + l)), solution: `2 × (${L} + ${l}) = ${2 * (L + l)} cm.` };
  }),
  ex("CM1", "cm1-mesures", "cm1-perimetre-carre", "Périmètre du carré", (r) => {
    const c = r.int(3, 25);
    return { prompt: `Périmètre d'un carré de côté ${c} m ?`, kind: "number", unit: "m", answer: String(4 * c), solution: `4 × ${c} = ${4 * c} m.` };
  }),

  // ── CM2 ──
  ex("CM2", "cm2-decimaux", "cm2-add-dec", "Additionner des décimaux", (r) => {
    const a = r.dec(1, 50, 2);
    const b = r.dec(1, 50, 1);
    return { prompt: `${fr(a)} + ${fr(b)} = ?`, kind: "number", answer: String(Math.round((a + b) * 100) / 100), solution: `On aligne les virgules : ${fr(a + b, 2)}.` };
  }),
  ex("CM2", "cm2-decimaux", "cm2-sous-dec", "Soustraire des décimaux", (r) => {
    const a = r.dec(10, 60, 2);
    const b = r.dec(1, 9, 1);
    return { prompt: `${fr(a)} − ${fr(b)} = ?`, kind: "number", answer: String(Math.round((a - b) * 100) / 100), solution: `${fr(a - b, 2)}.` };
  }),
  ex("CM2", "cm2-decimaux", "cm2-mult-dec", "Multiplier un décimal par un entier", (r) => {
    const a = r.dec(1, 20, 1);
    const b = r.int(2, 9);
    return { prompt: `${fr(a)} × ${b} = ?`, kind: "number", answer: String(Math.round(a * b * 10) / 10), solution: `${fr(a * b, 1)}.` };
  }),
  ex("CM2", "cm2-decimaux", "cm2-mult-10", "Multiplier un décimal par 10, 100, 1 000", (r) => {
    const a = r.dec(0.1, 9.9, 2);
    const k = r.pick([10, 100, 1000]);
    return { prompt: `${fr(a)} × ${fr(k)} = ?`, kind: "number", answer: String(Math.round(a * k * 100) / 100), solution: `La virgule se décale de ${String(k).length - 1} rang(s) vers la droite : ${fr(a * k, 2)}.` };
  }),
  ex("CM2", "cm2-fractions", "cm2-frac-dec", "Fraction décimale → décimal", (r) => {
    const d = r.pick([10, 100]);
    const n = r.int(d / 10 + 1, d * 5);
    return { prompt: `Écris ${n}/${d} sous forme décimale.`, kind: "number", answer: String(n / d), solution: `${n}/${d} = ${fr(n / d)}.` };
  }),
  ex("CM2", "cm2-fractions", "cm2-frac-egales", "Fractions égales", (r) => {
    const d = r.pick([2, 3, 4, 5]);
    const n = r.int(1, d - 1);
    const k = r.int(2, 6);
    return { prompt: `${n}/${d} = …/${d * k}`, kind: "number", answer: String(n * k), solution: `On multiplie le numérateur et le dénominateur par ${k} : ${n * k}/${d * k}.` };
  }),
  ex("CM2", "cm2-division", "cm2-div-reste", "Division avec reste : le reste", (r) => {
    const b = r.int(3, 12);
    const q = r.int(5, 40);
    const rr = r.int(1, b - 1);
    return { prompt: `Quel est le reste de la division de ${b * q + rr} par ${b} ?`, kind: "number", answer: String(rr), solution: `${b * q + rr} = ${b} × ${q} + ${rr}, le reste est ${rr}.` };
  }),
  ex("CM2", "cm2-division", "cm2-div-quotient", "Division avec reste : le quotient", (r) => {
    const b = r.int(3, 12);
    const q = r.int(5, 60);
    const rr = r.int(0, b - 1);
    return { prompt: `Quel est le quotient de la division de ${b * q + rr} par ${b} ?`, kind: "number", answer: String(q), solution: `${b * q + rr} = ${b} × ${q} + ${rr}.` };
  }),
  ex("CM2", "cm2-proportionnalite", "cm2-prix", "Prix et quantités", (r) => {
    const n = r.int(2, 6);
    const p = r.int(2, 9);
    const m = r.int(7, 15);
    return { prompt: `${n} cahiers coûtent ${n * p} €. Combien coûtent ${m} cahiers ?`, kind: "number", unit: "€", answer: String(m * p), solution: `1 cahier coûte ${n * p} ÷ ${n} = ${p} €, donc ${m} cahiers coûtent ${m * p} €.` };
  }),
  ex("CM2", "cm2-proportionnalite", "cm2-recette", "Recette", (r) => {
    const pers = r.pick([2, 4, 5]);
    const farine = pers * r.int(30, 60);
    const k = r.pick([2, 3]);
    return { prompt: `Pour ${pers} personnes, il faut ${farine} g de farine. Combien pour ${pers * k} personnes ?`, kind: "number", unit: "g", answer: String(farine * k), solution: `On multiplie par ${k} : ${farine * k} g.` };
  }),
  ex("CM2", "cm2-proportionnalite", "cm2-pourcentage-simple", "Pourcentages simples", (r) => {
    const p = r.pick([10, 25, 50]);
    const q = r.int(2, 30) * (p === 25 ? 4 : p === 10 ? 10 : 2);
    return { prompt: `Combien font ${p} % de ${q} ?`, kind: "number", answer: String((q * p) / 100), solution: `${p} % = ${frac(p, 100)}, donc ${(q * p) / 100}.` };
  }),
  ex("CM2", "cm2-mesures", "cm2-aire-rect", "Aire du rectangle", (r) => {
    const L = r.int(4, 25);
    const l = r.int(2, L);
    return { prompt: `Aire d'un rectangle de ${L} cm sur ${l} cm ?`, kind: "number", unit: "cm²", answer: String(L * l), solution: `${L} × ${l} = ${L * l} cm².` };
  }),
  ex("CM2", "cm2-mesures", "cm2-conversions", "Conversions de longueurs", (r) => {
    const v = r.dec(0.5, 9.5, 1);
    const [from, to, k] = r.pick([["m", "cm", 100], ["km", "m", 1000], ["cm", "mm", 10], ["m", "mm", 1000]] as const);
    return { prompt: `${fr(v)} ${from} = … ${to}`, kind: "number", unit: to, answer: String(Math.round(v * k * 10) / 10), solution: `1 ${from} = ${fr(k)} ${to}, donc ${fr(v * k)} ${to}.` };
  }),
  ex("CM2", "cm2-mesures", "cm2-durees", "Calculer une durée", (r) => {
    const h1 = r.int(8, 14);
    const m1 = r.pick([0, 15, 30, 45]);
    const dur = r.int(35, 150);
    const fin = h1 * 60 + m1 + dur;
    return {
      prompt: `Un trajet commence à ${h1} h ${String(m1).padStart(2, "0")} et finit à ${Math.floor(fin / 60)} h ${String(fin % 60).padStart(2, "0")}. Combien de minutes a-t-il duré ?`,
      kind: "number",
      unit: "min",
      answer: String(dur),
      solution: `${dur} min (soit ${Math.floor(dur / 60)} h ${dur % 60} min).`,
    };
  }),
];
