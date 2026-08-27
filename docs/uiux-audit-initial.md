# Audit UI/UX initial — Étape 6

## Qualification des outils

UI UX Pro Max a été installé temporairement dans `/tmp/uiux-pro-max` depuis son CLI officiel, initialisé en mode Universal et exécuté avec un brief d’application de supervision. Il a fourni des recommandations de design system, de typographie, d’accessibilité, de densité et de motion. Impeccable a été consulté sur sa documentation officielle et son installation `npx impeccable install` a été tentée dans un répertoire temporaire, mais le processus a dépassé le délai réseau de la session et a été arrêté. Aucun score officiel Impeccable ne sera donc revendiqué.

Les scores ci-dessous sont des **évaluations internes de référence**, guidées par les principes consultés, et non des sorties officielles de ces outils.

| Dimension | Score initial interne | Observations principales |
|---|---:|---|
| UI UX Pro Max — évaluation interne /100 | 62 | Base lisible et crédible, mais tokens dispersés, trop de rayons/ombres, hiérarchie et identité encore génériques. |
| Impeccable — évaluation interne /20 | 11 | Écran de connexion propre, mais aspect de carte SaaS interchangeable, accents trop nombreux et langage visuel peu distinctif. |

## Constats

La structure fonctionnelle est solide : sidebar persistante, navigation par domaines, états protégés et usage de composants partagés. La faiblesse se situe dans la cohérence visuelle : la feuille globale mélange DM Sans, Space Grotesk, couleurs Tailwind ponctuelles, valeurs hexadécimales et plusieurs niveaux de radius et d’ombres. La page d’accueil empile une grande carte sombre, des badges et quatre cartes KPI, ce qui donne une impression de template de dashboard malgré des contenus honnêtes.

La capture desktop montre un écran d’accès centré, beaucoup d’espace vide et une carte blanche épaisse. La capture mobile conserve la lisibilité mais la carte déborde visuellement jusqu’aux bords, le bouton est peu informatif dans la capture et l’identité se limite à un bouclier générique. Les principaux risques anti-AI-slop sont le gradient radial décoratif, la répétition de cartes, les rayons très élevés, les ombres génériques et l’absence de motif propre à l’infrastructure.

## Direction retenue

La refonte adopte une direction **secure infrastructure console minimalism** : palette ivoire froide, encre bleu-noir, accent cyan discret réservé aux actions et états actifs, surfaces calmes, grille technique très légère, rayons modérés, bordures fines et densité maîtrisée. La hiérarchie privilégie les titres courts, des métadonnées monospacées pour les identifiants et statuts, ainsi qu’une navigation plus structurée par sections.
