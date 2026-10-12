# Prompt à coller dans Claude Code

---

Tu travailles dans le repo GitHub **mael12854/preau**. Clone-le si besoin (`git clone https://github.com/mael12854/preau`), puis travaille dans ce repo. Crée une branche `feat/design-system`.

## Projet
Préau est une **alternative complète à École Directe** : l'espace numérique d'un collège ou d'un lycée. L'usage reste le même, mais l'outil doit être beaucoup plus clair et plus moderne. On conçoit d'abord pour ordinateur (référence 1280 × 800), et l'interface doit rester utilisable jusqu'à 360 px de large. Accessibilité RGAA 4.1 niveau AA, interfaces du personnel comprises.

**7 profils** : élève (collège), élève (lycée), parent, professeur, vie scolaire / CPE, direction, secrétariat.
**12 modules** : tableau de bord, emploi du temps, devoirs (le professeur le voit sous le nom « cahier de textes »), évaluations, vie scolaire, messagerie, documents, agenda, paiements & cantine, bulletins, appel & évaluation (professeur), mon compte.

## Référence de design
Le dossier `design_handoff_preau/` contient :
- `Preau Brand Guidelines.dc.html` : le guide de marque complet et un prototype cliquable de tous les écrans, pour tous les profils. Ouvre-le dans un navigateur et lis son code source : c'est la référence haute fidélité à reproduire au pixel près.
- `README.md` : tous les jetons (couleurs, typographie, espacements, rayons), les composants, les écrans et les règles métier.

Le HTML sert de référence visuelle. **Ne le copie pas tel quel** : reconstruis-le proprement dans la stack du repo.

## Règle métier non négociable
**Aucune note sur 20, aucune moyenne, aucun classement, nulle part.** Toutes les évaluations se font avec des pastilles de compétence à 4 niveaux :
- MI, maîtrise insuffisante : rouge `#C8402B`
- MF, maîtrise fragile : orange `#E8892B`
- MS, maîtrise satisfaisante : bleu `#2F6FC0`
- TB, très bonne maîtrise : vert `#2E8B57`
- NE / Abs. / Disp. : cercle vide gris

Une pastille n'apparaît jamais seule : son libellé est toujours affiché à côté et repris dans l'`aria-label`. Ces 4 couleurs sont réservées aux évaluations.

## Stack
Si le repo contient déjà une stack, garde-la. S'il est vide, pars sur Next.js (App Router) + TypeScript + Tailwind, avec les jetons déclarés en variables CSS dans le thème, et Radix UI pour les primitives accessibles. Polices via `next/font` : Schibsted Grotesk, Atkinson Hyperlegible Next. Icônes : Material Symbols Rounded.

## Étapes
1. Lis `design_handoff_preau/README.md` en entier, puis ouvre le prototype.
2. **Jetons** : déclare les variables CSS pour le mode clair et le mode sombre (`prefers-color-scheme` + bascule manuelle dans Mon compte). Ajoute un helper `subjectColor(hue)` en OKLCH pour les couleurs de matière.
3. **Composants** : logo (en SVG), bouton (principal / secondaire / tertiaire / danger), champ, case à cocher, radio, interrupteur, badge, chip matière, pastille d'évaluation, contrôle segmenté, alerte, toast, carte. Ajoute une page `/design-system` qui les présente tous.
4. **Coque applicative** : barre latérale de 240 px (nav filtrée selon le profil, compteurs), barre du haut de 72 px (titre, recherche, notifications), lien d'évitement « Aller au contenu ».
5. **Écrans** : reproduis-les dans cet ordre : tableau de bord élève/parent, tableau de bord personnel, évaluations, devoirs, emploi du temps, vie scolaire, messagerie, appel & évaluation (prof), bulletins, paiements & cantine, documents, agenda, mon compte. Utilise des données de démo typées (`/lib/mock`) : mêmes noms, mêmes textes que dans le prototype.
6. **Accessibilité** : focus visible partout (contour 3 px `#E8673A`, décalage 2 px), cibles d'au moins 44 px, navigation complète au clavier, texte zoomable à 200 %, respect de `prefers-reduced-motion`.
7. Vérifie que la recherche « /20 », « moyenne », « classement » ne donne aucun résultat dans l'interface.

## Ton des textes
Vouvoiement pour tout le monde. Les élèves sont salués par leur prénom (« Bonjour Léa »), les adultes par civilité + nom (« Bonjour Madame Martin »). Phrases courtes, verbe d'action, aucun jargon (« Justifier l'absence », pas « Procéder à la régularisation »). Formats : « mar. 13 oct. », « 8 h 30 » (08:30 dans les grilles), « 23,40 € », « 4e B ».

Commite par étape avec des messages clairs. Pose-moi une question si quelque chose est ambigu, plutôt que d'inventer.
