#!/usr/bin/env node
/**
 * Règle métier : aucune note sur 20, aucune moyenne, aucun classement dans l'interface.
 * Parcourt le code de l'application (hors référence de design) et échoue si un terme interdit apparaît.
 * Usage : npm run check:wording
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIRS = ["app", "components", "lib"];
const FORBIDDEN = [/\/\s?20\b/, /moyenne/i, /classement/i, /\branking\b/i];

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
      for (const re of FORBIDDEN) if (re.test(line)) hits.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
    });
}

if (hits.length) {
  console.error("Termes interdits trouvés (notes sur 20, moyenne, classement) :\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`OK : aucun « /20 », « moyenne » ni « classement » dans ${files.length} fichiers.`);

/* Avec --url=http://localhost:3000 : vérifie aussi le texte rendu de chaque écran, pour chaque profil. */
const urlArg = process.argv.find((a) => a.startsWith("--url="));
if (urlArg) {
  const base = urlArg.slice(6);
  const { PROFILE_IDS, SLUGS } = await import("./routes.mjs");
  const bad = [];
  for (const profile of PROFILE_IDS) {
    for (const slug of ["", "design-system", ...SLUGS]) {
      const res = await fetch(`${base}/${slug}`, { headers: { cookie: `preau-profil=${profile}` }, redirect: "follow" });
      const text = (await res.text())
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ");
      for (const re of FORBIDDEN) if (re.test(text)) bad.push(`${profile} /${slug} : ${re}`);
    }
  }
  if (bad.length) {
    console.error("Termes interdits dans l'interface rendue :\n" + bad.join("\n"));
    process.exit(1);
  }
  console.log(`OK : interface rendue vérifiée pour ${PROFILE_IDS.length} profils.`);
}
