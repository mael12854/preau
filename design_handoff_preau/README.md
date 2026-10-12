# Handoff — Préau
Repo cible : **mael12854/preau**. Référence haute fidélité : `Preau Brand Guidelines.dc.html` (guide + prototype cliquable, 7 profils × 12 modules). À recréer dans la stack du repo, pas à copier.

## Règle centrale : pastilles, jamais de notes sur 20
| Sigle | Libellé | Clair | Sombre |
|---|---|---|---|
| MI | Maîtrise insuffisante | #C8402B | #EC6A55 |
| MF | Maîtrise fragile | #E8892B | #F2A35A |
| MS | Maîtrise satisfaisante | #2F6FC0 | #5C95E0 |
| TB | Très bonne maîtrise | #2E8B57 | #4DB37C |
| NE/Abs./Disp. | Non évalué… | cercle vide, bordure 2px #CFC9BB | |
Libellé toujours visible + aria-label. Tailles 16 (liste) · 20 (saisie, cible 44) · 24 (tableau) · 28 (détail). Ordre fixe MI→TB. Pas de moyenne ni classement.

## Couleurs
| Jeton | Clair | Sombre |
|---|---|---|
| --brand | #1F5546 (hover #17463A, sidebar #173F35, tint #E3EEE9) | #7FC4AE |
| --accent (focus, compteurs — jamais en texte) | #E8673A | #F08A62 |
| --bg | #F5F3EC | #111816 |
| --surface / --surface-2 | #FFFFFF / #FAF9F5 | #1A2321 |
| --neutral-bg / --segmented-bg | #EEEBE3 / #E8E4DA | |
| --line / --line-strong | #E2DED3 / #CFC9BB | #2A3633 / #4A5753 |
| --ink / --ink-2 / --ink-muted | #1B2421 / #3D4945 / #5F6B66 | #E9E6DD / — / #9AA59F |

Sémantiques (texte/fond) : succès #2F7D4F/#E4F2E8 · attention #9A6512/#FBF0D9 · action requise #B83A26/#FBE6E1 · info #2D63A8/#E3ECF8 · neutre #3D4945/#EEEBE3.

Matières : pastille `oklch(0.6 0.13 h)`, fond `oklch(0.95 0.035 h)`, texte `oklch(0.38 0.09 h)`, texte sombre `oklch(0.8 0.1 h)`. h : Arts 0 · Français 30 · Hist-Géo 60 · SES/Philo 90 · EPS 120 · SVT 150 · Physique-Chimie 180 · Techno 210 · Maths 240 · Espagnol/LV2 270 · Anglais 300 · Musique 330.

## Typo
Schibsted Grotesk (titres 600–800) · Atkinson Hyperlegible Next (UI 400/500/700, tabular-nums en tableaux).
display 56/56 800 −4 % · h1 32/36 700 −2,5 % (26 dans la barre du haut) · h2 20/26 700 −1 % · body 16/25 · label 14/20 700 · caption 13/18 (minimum).
Logotype « préau » minuscules, Schibsted 800, −3 %.

## Espaces, rayons, ombres
Espaces 4·8·12·16·24·32·48·64 · Rayons 6 badge · 10 bouton/champ · 12 alerte · 14 carte · 999 chip · Hauteurs 36/44 (défaut, min)/52 · Cartes sans ombre (bordure --line) · Menus/modales `0 12px 32px rgba(27,36,33,.14)` · Focus `3px solid #E8673A`, offset 2px.

## Icônes
Material Symbols Rounded 400, contour ; FILL 1 pour nav active. space_dashboard, calendar_view_week, menu_book, donut_large, how_to_reg, mail, folder, event, payments, restaurant, article, fact_check, settings, event_busy, schedule.

## Logo
Carré --brand rayon 25 %, arche Craie (bordure haut+côtés, rayon 999 haut) : left/right 25 %, top 40,8 %, bottom 21,7 %, épaisseur ≈8,3 %. Faire un SVG. Inversé : carré Craie + arche Tableau. Favicon ≥16 px, logo complet ≥80 px, zone de protection = hauteur de l'arche.

## Écrans (voir prototype)
- **Coque** : sidebar 240 px #173F35 (logo, établissement, nav par profil avec compteurs orange, utilisateur), barre haute 72 px (titre, recherche 280, notifications), contenu padding 28/32.
- **Accueil élève/parent** : salutation, alerte absence à justifier, EDT du jour (cours en cours cerclé), devoirs de demain cochables, dernières évaluations, vie scolaire, messages. Parent : sélecteur d'enfant.
- **Accueil personnel** : 3 indicateurs, liste du jour avec statuts, « À traiter ». Contenu propre à prof/CPE/direction/secrétariat.
- **Évaluations** : onglets trimestre, tableau matière × pastilles + barre de répartition ; panneau détail (compétences, commentaire).
- **Devoirs** : groupés par jour d'échéance, coche personnelle (non visible du prof), badge Contrôle, pièces jointes, progression de la semaine.
- **EDT** : grille semaine 8 h–17 h, 60 px/h, blocs couleur matière, jour courant en vert, cours annulé barré.
- **Vie scolaire** : 4 compteurs, liste des événements avec statut et « Justifier ».
- **Messagerie** : dossiers / liste / lecture + réponse.
- **Appel & évaluation (prof)** : appel Présent/Absent/Retard + « Valider l'appel » ; grille élèves × compétences, clic = niveau suivant (NE→MI→…→TB), « Publier ».
- **Bulletins** : liste des périodes, positionnement 4 cases par matière, appréciation, mention du conseil, PDF.
- **Paiements & cantine** : solde + recharge, menu du jour, factures avec statut et « Payer ».
- **Documents** : filtres, tableau, badge « À signer ». **Agenda** : mois, événements colorés. **Compte** : profil, interrupteurs (notifications, mode sombre, sigles sur pastilles), double authentification.

## Rédaction
Vouvoiement pour tous ; « Bonjour Léa » / « Bonjour Madame Martin ». Verbes d'action, aucun jargon. Formats : mar. 13 oct. · 8 h 30 (08:30 en grille) · 23,40 € · 4e B · M. Durand.

## Accessibilité (RGAA AA)
La couleur ne porte jamais seule l'information · focus visible · cibles ≥ 44 px · lien d'évitement · zoom 200 % · prefers-reduced-motion · options taille du texte 100/115/130 %, contraste renforcé, sigles sur pastilles.
