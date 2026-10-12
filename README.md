# Préau

L'espace numérique du collège et du lycée : une alternative complète à École Directe, plus claire et plus moderne.
Conçu d'abord pour ordinateur (référence 1280 × 800), utilisable jusqu'à 360 px de large. Accessibilité visée : RGAA 4.1 niveau AA, interfaces du personnel comprises.

> **Règle métier non négociable** : aucune note sur 20, aucune moyenne, aucun classement. Les évaluations utilisent quatre pastilles de compétence (MI, MF, MS, TB). Le libellé est toujours affiché à côté de la pastille et repris dans l'`aria-label`.

## Démarrer

```bash
npm install
npm run dev            # http://localhost:3000
```

| Script | Rôle |
|---|---|
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (config Next.js) |
| `npm run check:wording` | Cherche « /20 », « moyenne » et « classement » dans le code. Avec `-- --url=http://localhost:3000`, vérifie aussi l'interface rendue pour les 7 profils |

La page d'accueil `/` sert à choisir un **profil de démonstration**, enregistré dans un cookie. Les 7 profils sont : élève (collège), élève (lycée), parent, professeur, vie scolaire / CPE, direction, secrétariat. Chaque profil ne voit que ses modules. La page `/design-system` présente tous les composants.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 : les jetons sont des variables CSS déclarées dans `app/globals.css` et exposées au thème via `@theme inline`
- Radix UI (`radix-ui`) pour les primitives accessibles : case à cocher, radio, interrupteur, liste déroulante, onglets, contrôle segmenté, modale, toast, menu
- Polices via `next/font` : Schibsted Grotesk (titres), Atkinson Hyperlegible Next (interface)
- Icônes : Material Symbols Rounded. Seuls les glyphes listés dans `lib/icons.ts` sont chargés (`icon_names`)

## Organisation

```
app/
  globals.css            jetons clair / sombre, typographie (rem), focus, reduced-motion
  page.tsx               choix du profil de démonstration
  design-system/         vitrine des composants
  (app)/<module>/        un écran par module, protégé par requireModule()
components/
  ui/                    logo SVG, bouton, champ, choix, badge, chip matière, pastille,
                         segmenté, alerte, toast, carte, modale, avatar, icône
  shell/                 coque : barre latérale 240 px, barre du haut 72 px, tiroir mobile,
                         lien d'évitement
  screens/               écrans (tableaux de bord, évaluations, devoirs, EDT…)
lib/
  mock/                  données de démonstration typées (noms et textes du prototype)
  evaluation.ts          niveaux MI → TB, NE / Abs. / Disp., cycle de saisie, répartition
  subjects.ts            subjectColor(hue) / subjectStyle(hue) en OKLCH
  format.ts              « mar. 13 oct. », « 8 h 30 », « 08:30 », « 23,40 € »
  preferences.ts         thème, sigles sur pastilles, contraste renforcé, taille du texte
design_handoff_preau/    référence de design (guide de marque et prototype cliquable)
```

### Modules et URL

| Module | URL | Profils |
|---|---|---|
| Tableau de bord | `/accueil` | tous (vue élève/parent ou vue personnel) |
| Emploi du temps | `/emploi-du-temps` | élèves, parent, professeur, CPE |
| Devoirs (« Cahier de textes » pour le professeur) | `/devoirs` | élèves, parent, professeur |
| Évaluations | `/evaluations` | élèves, parent |
| Vie scolaire | `/vie-scolaire` | élèves, parent, CPE, direction |
| Messagerie | `/messagerie` | tous |
| Documents | `/documents` | tous |
| Agenda | `/agenda` | tous |
| Paiements & cantine | `/paiements` | parent, secrétariat |
| Bulletins | `/bulletins` | élèves, parent, direction |
| Appel & évaluation | `/appel` | professeur |
| Mon compte | `/compte` | tous |

## Jetons et thèmes

- **Mode sombre** : il suit `prefers-color-scheme`, et l'interrupteur « Mode sombre » de Mon compte le force (`html[data-theme]`). Un script inline appliqué avant le premier rendu évite le flash de thème.
- **Couleurs de matière** : une teinte par matière. `subjectStyle(h)` pose `--subject-h` ; la classe `.subject` dérive la pastille, le fond et le texte (plus clair en mode sombre). Utilitaires disponibles : `bg-subject-dot`, `bg-subject-tint`, `text-subject-ink`.
- **Couleurs d'évaluation** (`--eval-mi/mf/ms/tb`) : réservées aux pastilles, plus claires en mode sombre.
- **Typographie en rem** : le zoom texte à 200 % et l'option « Taille du texte » (100 / 115 / 130 %) agrandissent toute l'interface.

## Accessibilité

- Focus visible partout : contour 3 px `--accent`, décalage 2 px. Il s'applique aussi aux champs, à la recherche et aux options des menus
- Cibles d'au moins 44 px. Les boutons compacts de 36 px étendent leur zone cliquable par un pseudo-élément
- Lien d'évitement « Aller au contenu », titres hiérarchisés, `aria-current` dans la navigation
- Navigation complète au clavier : primitives Radix, focus piégé dans les modales et le tiroir
- `prefers-reduced-motion` coupe les animations
- Options dans Mon compte : sigles dans les pastilles, contraste renforcé, taille du texte
- Vérifié avec axe-core (WCAG 2.2 A/AA et bonnes pratiques) sur tous les écrans, en clair et en sombre : aucune violation

## Écarts assumés par rapport au guide

- **Contraste des tons sémantiques** : succès `#2F7D4F` sur `#E4F2E8` donne 4,35:1, et attention `#9A6512` sur `#FBF0D9` donne 4,37:1. Les deux sont sous le seuil AA de 4,5:1 pour les badges en 12,5 px. Ils sont légèrement assombris (`#2D784C`, `#956211`), ce qui donne au moins 4,6:1.
- **Valeurs du mode sombre** : le README du handoff ne donne pas toutes les valeurs sombres (surfaces secondaires, tons sémantiques, barre latérale). Elles ont été dérivées et vérifiées pour le contraste.
- **Pastilles du tableau d'évaluations** : le prototype n'affiche que des disques. Le sigle est maintenant visible à côté de chaque disque, pour respecter la règle « jamais seule ».
- **Taille de texte et contraste renforcé** : ces options sont décrites dans le guide (section Accessibilité) mais absentes du prototype de Mon compte. Elles sont ajoutées dans une carte « Lisibilité ».
