# Préau

L'espace numérique du collège et du lycée : une alternative complète à École Directe, plus claire et plus moderne.
Conçu d'abord pour ordinateur (référence 1280 × 800), utilisable jusqu'à 360 px de large. Accessibilité visée : RGAA 4.1 niveau AA, interfaces du personnel comprises.

> **Règle métier non négociable** : aucune note sur 20, aucune moyenne, aucun classement. Les évaluations utilisent quatre pastilles de compétence (MI, MF, MS, TB). Le libellé est toujours affiché à côté de la pastille et repris dans l'`aria-label`.

## Démarrer

```bash
npm install
cp .env.example .env.local   # URL et clé publiable du projet Supabase « preau »
npm run dev                  # http://localhost:3000
```

| Script | Rôle |
|---|---|
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (config Next.js) |
| `npm run check:wording` | Cherche « /20 », « moyenne » et « classement » dans le code de l'application |

On se connecte sur `/connexion` avec une adresse e-mail et un mot de passe (Supabase Auth). Chaque profil ne voit que ses modules. La page `/design-system` présente tous les composants.

### Comptes de démonstration

Mot de passe commun : `preau-demo-2026`. **À supprimer avant toute utilisation réelle.** Les adresses utilisent le domaine réservé `.example` : aucun e-mail ne peut leur être envoyé.

| Profil | Adresse |
|---|---|
| Élève · collège (Léa Martin, 4e B) | `lea.martin@jean-moulin.example` |
| Élève · lycée (Hugo Benali, 1re 3) | `hugo.benali@jean-moulin.example` |
| Parent (Sophie Martin) | `sophie.martin@famille.example` |
| Professeur (Marc Durand) | `marc.durand@jean-moulin.example` |
| Vie scolaire / CPE (Nadia Kader) | `nadia.kader@jean-moulin.example` |
| Direction (Paul Lefèvre) | `principal@jean-moulin.example` |
| Secrétariat (Claire Roux) | `secretariat@jean-moulin.example` |

L'application utilise l'heure réelle. Pour des essais, `PREAU_NOW` permet de la figer.

## Base de données (Supabase)

- `supabase/migrations/` : schéma, sécurité (RLS), fonctions métier. À appliquer dans l'ordre.
- `supabase/seed.sql` : l'établissement, ses classes et matières, et les personnes (comptes, élèves, responsables, enseignants). Aucune donnée scolaire : emploi du temps, devoirs, évaluations, messages, documents et factures sont à saisir dans l'application.
- `lib/supabase/database.types.ts` : types générés depuis le schéma ; à régénérer après chaque migration.

**Règle « aucune note » dans la base** : les évaluations ne stockent que le type `eval_value` (MI, MF, MS, TB, NE, ABS, DISP). Aucune colonne numérique de note n'existe. Le niveau global d'une évaluation n'est jamais calculé à partir des compétences : ce serait une moyenne déguisée.

**Qui voit quoi (RLS)** :
- un élève ne voit que lui-même, un responsable que ses enfants ;
- un professeur voit ses classes et seulement ses propres évaluations ; une évaluation n'est visible des familles qu'une fois publiée ;
- la coche « fait » d'un devoir n'est visible que de la personne qui l'a cochée, jamais du professeur ;
- l'argent (solde, factures) est visible de la famille, du secrétariat et de la direction, pas des professeurs ;
- les coordonnées (e-mail, téléphone) ne sont visibles que de la personne et de l'administration.

Les écritures sensibles passent par des fonctions SQL qui vérifient les droits : `validate_attendance`, `set_assessment_result`, `publish_assessment`, `justify_life_event`, `send_message`, `start_payment`, `cancel_payment`, `sign_document`.

### Paiements (Crédit Domestique)

Le navigateur ne crédite jamais rien : seul le serveur du prestataire confirme un paiement.

1. Le responsable clique sur « Payer » ou « + 20 € ». L'action serveur appelle `start_payment`, qui crée une ligne `payments` en attente (un seul paiement en attente par facture).
2. `createCheckout` (`lib/payments.ts`) ouvre la session de paiement chez Crédit Domestique et renvoie l'adresse de sa page de paiement, vers laquelle la famille est redirigée. **À brancher** : tant que la fonction renvoie `null`, le paiement reste « en attente de confirmation » et la famille peut l'annuler.
3. Le webhook du prestataire, reçu par une Supabase Edge Function ou une route API, appelle `confirm_payment(id, 'reussi' | 'echoue', référence)` avec la clé `service_role`. Cette fonction n'est exécutable par aucun utilisateur connecté. Elle est idempotente : un paiement déjà traité n'est pas modifié. En cas de succès, elle règle la facture ou crédite le solde cantine.

Pensez à vérifier la signature du webhook avant d'appeler `confirm_payment`.

Les comptes sont créés par l'établissement, pas par inscription libre. Un compte sans fiche dans un établissement ne voit rien et tombe sur la page « compte non rattaché ».

### Encore sur données du prototype

- **Tableaux de bord de la vie scolaire, de la direction et du secrétariat** (`lib/mock/staff.ts`) : il manque les tables des demandes administratives et des conseils de classe. Le tableau de bord du professeur, lui, est calculé depuis la base.
- **Paiements** : le parcours est prêt côté base ; il reste à brancher l'API Crédit Domestique dans `lib/payments.ts` et le webhook de confirmation.
- **Documents** : il n'y a pas encore de fichiers dans Supabase Storage (le téléchargement est factice).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 : les jetons sont des variables CSS déclarées dans `app/globals.css` et exposées au thème via `@theme inline`
- Supabase : Postgres, Auth (e-mail + mot de passe), sécurité au niveau des lignes ; `@supabase/ssr` pour la session
- Radix UI (`radix-ui`) pour les primitives accessibles : case à cocher, radio, interrupteur, liste déroulante, onglets, contrôle segmenté, modale, toast, menu
- Polices via `next/font` : Schibsted Grotesk (titres), Atkinson Hyperlegible Next (interface)
- Icônes : Material Symbols Rounded. Seuls les glyphes listés dans `lib/icons.ts` sont chargés (`icon_names`)

## Organisation

```
app/
  globals.css            jetons clair / sombre, typographie (rem), focus, reduced-motion
  page.tsx               redirige vers /accueil
  design-system/         vitrine des composants
  (app)/<module>/        un écran par module, protégé par requireModule()
  (app)/actions.ts       actions serveur (coche, appel, saisie, messages, paiements…)
  connexion/             connexion par e-mail et mot de passe
proxy.ts                 rafraîchit la session et redirige vers /connexion
components/
  ui/                    logo SVG, bouton, champ, choix, badge, chip matière, pastille,
                         segmenté, alerte, toast, carte, modale, avatar, icône
  shell/                 coque : barre latérale 240 px, barre du haut 72 px, tiroir mobile,
                         lien d'évitement
  screens/               écrans (tableaux de bord, évaluations, devoirs, EDT…)
lib/
  supabase/              clients Supabase (serveur) et types générés
  data/                  chargeurs de données par écran (lecture sous RLS)
  session.ts             personne connectée, menu et compteurs
  mock/staff.ts          tableaux de bord CPE / direction / secrétariat (prototype)
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
