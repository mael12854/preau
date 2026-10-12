#!/usr/bin/env node
/**
 * Règle métier : aucune moyenne, aucun classement dans l'interface. La note sur 20 n'existe que pour
 * les établissements réglés sur « note20 » et passe uniquement par lib/grading.ts.
 * Parcourt le code de l'application (hors référence de design) et échoue si un terme interdit apparaît.
 * Usage : npm run check:wording
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib"];
// « 12/20 » ou « / 20 », mais pas une opacité Tailwind comme « ink/20 ».
const FORBIDDEN = [/(?<![a-z-])\/\s?20\b/i, /moyenne/i, /classement/i, /\branking\b/i];
// Seul fichier autorisé à écrire « /20 » : le formatage des notes (établissements notés sur 20).
const SCORE_FILE = join("lib", "grading.ts");

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css|mjs)$/.test(name)) files.push(p);
  }
};
DIRS.forEach((d) => walk(join(ROOT, d)));

const hits = [];
for (const f of files) {
  readFileSync(f, "utf8")
    .split("\n")
    .forEach((line, i) => {
      // Les commentaires qui énoncent la règle elle-même sont tolérés.
      if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
      for (const re of FORBIDDEN) if (re.test(line) && !(re === FORBIDDEN[0] && relative(ROOT, f) === SCORE_FILE)) hits.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
    });
}

if (hits.length) {
  console.error("Termes interdits trouvés (notes sur 20, moyenne, classement) :\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`OK : aucun « /20 » (hors lib/grading.ts), « moyenne » ni « classement » dans ${files.length} fichiers.`);
