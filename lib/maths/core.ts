/**
 * Moteur des exercices de maths : tirage reproductible (graine), lecture et correction des réponses.
 * Un exercice tiré avec la même graine donne toujours le même énoncé : le serveur recorrige sans rien stocker d'autre.
 */

export type Level = "CP" | "CE1" | "CE2" | "CM1" | "CM2" | "6e" | "5e" | "4e" | "3e" | "2de";
export const LEVELS: Level[] = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "2de"];
export const PRIMARY_LEVELS: Level[] = ["CP", "CE1", "CE2", "CM1", "CM2"];

/** Type de réponse attendue. */
export type AnswerKind = "number" | "fraction" | "expr" | "choice" | "text";

export type Question = {
  /** Énoncé (texte, sauts de ligne autorisés). */
  prompt: string;
  kind: AnswerKind;
  /** Réponse de référence : nombre (« 3,5 »), fraction (« 7/3 »), expression (« 2x+3 »), choix ou texte. */
  answer: string;
  /** QCM : propositions (la réponse est l'une d'elles). */
  choices?: string[];
  /** Unité affichée après la case (cm, €, °…). */
  unit?: string;
  /** Tolérance absolue pour les nombres (arrondis). */
  tolerance?: number;
  /** Correction rédigée, montrée après la réponse. */
  solution: string;
  /** Expressions : forme exigée (développée = sans parenthèses ; factorisée = avec). */
  form?: "developpee" | "factorisee";
};

export type Exercise = {
  id: string;
  level: Level;
  /** Identifiant du chapitre (voir chapters.ts). */
  chapter: string;
  title: string;
  make: (r: Rng) => Question;
};

// ── Tirage reproductible (mulberry32) ──
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Entier entre a et b inclus. */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  /** Entier non nul entre a et b. */
  nz(a: number, b: number): number {
    let v = 0;
    while (v === 0) v = this.int(a, b);
    return v;
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }
  sign(): 1 | -1 {
    return this.next() < 0.5 ? -1 : 1;
  }
  /** Décimal à `d` chiffres après la virgule entre a et b. */
  dec(a: number, b: number, d: number): number {
    const k = 10 ** d;
    return this.int(Math.round(a * k), Math.round(b * k)) / k;
  }
  shuffle<T>(list: T[]): T[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/** Graine d'une question : graine de la tentative et rang de la question. */
export function questionSeed(seed: number, index: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, 2654435761) + Math.imul(index + 1, 40503)) >>> 0;
}

// ── Écriture française des nombres ──
export function fr(n: number, maxDecimals = 6): string {
  const r = Math.round(n * 10 ** maxDecimals) / 10 ** maxDecimals;
  const s = String(Object.is(r, -0) ? 0 : r);
  const [i, d] = s.split(".");
  const neg = i.startsWith("-");
  const digits = neg ? i.slice(1) : i;
  const grouped = digits.length > 4 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : digits;
  return `${neg ? "−" : ""}${grouped}${d ? "," + d : ""}`;
}
/** Nombre entre parenthèses s'il est négatif : (−3). */
export const par = (n: number) => (n < 0 ? `(${fr(n)})` : fr(n));
/** Terme signé pour une somme : « + 3 », « − 3 ». */
export const signed = (n: number) => (n < 0 ? `− ${fr(-n)}` : `+ ${fr(n)}`);

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);

/** Fraction irréductible écrite « a/b » (ou entier). */
export function frac(n: number, d: number): string {
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1;
  n /= g;
  d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}
/** Affichage d'une fraction dans un énoncé : 3/4 → « 3/4 », −3/4 → « −3/4 ». */
export const showFrac = (n: number, d: number) => frac(n, d).replace("-", "−");

/** Monôme « ax » propre : 1x → x, −1x → −x. */
export function mono(a: number, v = "x"): string {
  if (a === 1) return v;
  if (a === -1) return `−${v}`;
  return `${fr(a)}${v}`;
}
/** Polynôme ax² + bx + c écrit proprement (termes nuls omis). */
export function poly(coefs: number[], v = "x"): string {
  const deg = coefs.length - 1;
  const parts: string[] = [];
  coefs.forEach((c, i) => {
    if (!c) return;
    const p = deg - i;
    const vv = p === 0 ? "" : p === 1 ? v : `${v}²`;
    const abs = Math.abs(c);
    const body = vv ? (abs === 1 ? vv : `${fr(abs)}${vv}`) : fr(abs);
    parts.push(parts.length === 0 ? (c < 0 ? `−${body}` : body) : c < 0 ? ` − ${body}` : ` + ${body}`);
  });
  return parts.join("") || "0";
}

// ── Lecture des réponses ──
function normalize(s: string): string {
  return s
    .trim()
    .replace(/−|–/g, "-")
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/(\d)\s+(?=\d{3}\b)/g, "$1")
    .replace(/,/g, ".")
    .replace(/\s+/g, "");
}

/** Nombre décimal ou fraction (« 3,5 », « -7/4 », « 1 250 »). */
export function readNumber(s: string): number | null {
  const t = normalize(s).replace(/[a-zA-Z€%°]+$/g, "");
  if (/^[+-]?\d+(\.\d+)?$/.test(t)) return Number(t);
  const m = /^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/.exec(t);
  if (m && Number(m[2]) !== 0) return Number(m[1]) / Number(m[2]);
  return null;
}

// Expressions en x : + − × ÷ ^, parenthèses, multiplication implicite (3x, 2(x+1), (x+1)(x−1)).
type Tok = { t: "n"; v: number } | { t: "v"; v: string } | { t: "o"; v: string };
function tokenize(src: string): Tok[] | null {
  const s = normalize(src).replace(/:/g, "/");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\d|\./.test(c)) {
      let j = i;
      while (j < s.length && /[\d.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (Number.isNaN(v)) return null;
      out.push({ t: "n", v });
      i = j;
    } else if (/[a-z]/i.test(c)) {
      out.push({ t: "v", v: c.toLowerCase() });
      i++;
    } else if ("+-*/^()".includes(c)) {
      out.push({ t: "o", v: c });
      i++;
    } else return null;
  }
  // Multiplication implicite.
  const res: Tok[] = [];
  for (const tk of out) {
    const prev = res.at(-1);
    const prevEnds = prev && (prev.t === "n" || prev.t === "v" || (prev.t === "o" && prev.v === ")"));
    const curStarts = tk.t === "n" || tk.t === "v" || (tk.t === "o" && tk.v === "(");
    if (prevEnds && curStarts && !(prev!.t === "n" && tk.t === "n")) res.push({ t: "o", v: "*" });
    res.push(tk);
  }
  return res;
}
type Node = (vars: Record<string, number>) => number;
function parse(tokens: Tok[]): Node | null {
  let i = 0;
  const peek = () => tokens[i];
  const eat = (v: string) => {
    const tk = tokens[i];
    if (tk && tk.t === "o" && tk.v === v) {
      i++;
      return true;
    }
    return false;
  };
  function primary(): Node | null {
    const tk = peek();
    if (!tk) return null;
    if (tk.t === "n") {
      i++;
      return () => tk.v;
    }
    if (tk.t === "v") {
      i++;
      return (vars) => vars[tk.v] ?? NaN;
    }
    if (eat("(")) {
      const e = sum();
      if (!e || !eat(")")) return null;
      return e;
    }
    return null;
  }
  function power(): Node | null {
    const b = primary();
    if (!b) return null;
    if (eat("^")) {
      const e = unary();
      if (!e) return null;
      return (v) => b(v) ** e(v);
    }
    return b;
  }
  function unary(): Node | null {
    if (eat("-")) {
      const e = unary();
      return e ? (v) => -e(v) : null;
    }
    if (eat("+")) return unary();
    return power();
  }
  function product(): Node | null {
    let left: Node | null = unary();
    if (!left) return null;
    for (;;) {
      if (eat("*")) {
        const r = unary();
        if (!r) return null;
        const l: Node = left;
        left = (v) => l(v) * r(v);
      } else if (eat("/")) {
        const r = unary();
        if (!r) return null;
        const l: Node = left;
        left = (v) => l(v) / r(v);
      } else return left;
    }
  }
  function sum(): Node | null {
    let left: Node | null = product();
    if (!left) return null;
    for (;;) {
      if (eat("+")) {
        const r = product();
        if (!r) return null;
        const l: Node = left;
        left = (v) => l(v) + r(v);
      } else if (eat("-")) {
        const r = product();
        if (!r) return null;
        const l: Node = left;
        left = (v) => l(v) - r(v);
      } else return left;
    }
  }
  const e = sum();
  return e && i === tokens.length ? e : null;
}
export function readExpr(s: string): Node | null {
  const t = tokenize(s);
  return t && t.length ? parse(t) : null;
}

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** La réponse de l'élève est-elle juste ? */
export function isCorrect(q: Question, given: string): boolean {
  if (!given || !given.trim()) return false;
  switch (q.kind) {
    case "number":
    case "fraction": {
      const a = readNumber(given);
      const b = readNumber(q.answer);
      if (a === null || b === null) return false;
      return Math.abs(a - b) <= (q.tolerance ?? 1e-9) + 1e-12;
    }
    case "expr": {
      if (q.form === "factorisee" && !given.includes("(")) return false;
      if (q.form === "developpee" && given.includes("(")) return false;
      const a = readExpr(given);
      const b = readExpr(q.answer);
      if (!a || !b) return false;
      // Égalité testée en plusieurs points (x, et a, b s'ils servent).
      for (const x of [-2.5, -1, 0.5, 1.75, 3, 4.2]) {
        const vars = { x, a: x + 1.3, b: 2 - x, y: x / 2 + 1, t: x * 1.5, n: x + 0.7 };
        const va = a(vars);
        const vb = b(vars);
        if (!Number.isFinite(va) || !Number.isFinite(vb) || Math.abs(va - vb) > 1e-6 * Math.max(1, Math.abs(vb))) return false;
      }
      return true;
    }
    case "choice":
      return strip(given) === strip(q.answer);
    case "text":
      return strip(given) === strip(q.answer);
  }
}

/** Note sur 20 au demi-point. */
export const scoreOf = (good: number, total: number) => (total ? Math.round((good / total) * 40) / 2 : 0);
