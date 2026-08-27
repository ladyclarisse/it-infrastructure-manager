# Diagnostic préalable — Étape 4.1

## Conclusion courte

Le diagnostic initial a confirmé une divergence complète : schéma Drizzle `mysqlTable`/`mysqlEnum`, client `drizzle-orm/mysql2`, dépendance `mysql2`, configuration `dialect: "mysql"` et migrations SQL MySQL. Cette divergence a été corrigée dans la présente itération : le code utilise désormais `pgTable`/`pgEnum`, `drizzle-orm/node-postgres`, `pg`, une configuration `dialect: "postgresql"` et une chaîne de migrations PostgreSQL dédiée.

## Divergences relevées

| Zone | État observé | Risque |
|---|---|---|
| Schéma Drizzle | `pgTable`, `pgEnum`, `pg-core`, identités PostgreSQL | Conversion appliquée ; DDL PostgreSQL générable |
| Accès runtime | `drizzle-orm/node-postgres` + `Pool` dans `server/db.ts` | Adaptateur PostgreSQL appliqué ; connexion réelle encore à prouver |
| Configuration migrations | `dialect: "postgresql"`, sortie `drizzle-pg/` | Génération PostgreSQL appliquée |
| Migrations historiques | DDL avec backticks, `AUTO_INCREMENT`, `enum`, `ON UPDATE` | Non exécutables tels quels sur une base PostgreSQL vierge |
| Dépendances | `pg` et `@types/pg` utilisés ; `mysql2` supprimé | Lockfile aligné sur PostgreSQL |
| Environnement documenté | `DATABASE_URL=postgresql://...@postgres:5432/...` | Aligné sur le hostname Compose ; secret fourni hors Git |
| Compose | PostgreSQL 16, backend, frontend, Prometheus et Node Exporter déclarés | Configuration statique présente ; disponibilité runtime à vérifier dans l’environnement courant |
| Timestamps | `defaultNow()` et mises à jour explicites côté application | Conversion appliquée ; aucun `onUpdateNow()` conservé |
| Enums | `pgEnum` nommés avec types PostgreSQL dédiés | Conversion appliquée ; collisions de noms évitées |
| Relations/index | Présents dans le modèle | À conserver et vérifier dans la nouvelle chaîne de migrations |

## Stratégie retenue

Une chaîne de migrations PostgreSQL séparée a été générée depuis le schéma Drizzle converti dans `drizzle-pg/`, avec conservation des migrations MySQL historiques pour la traçabilité et sans tentative de les exécuter sur PostgreSQL. Le schéma métier, les noms de tables/colonnes, les contraintes et les index seront conservés autant que possible. La preuve runtime sera déclarée uniquement après connexion réelle, migration réelle, requête réelle et réponse backend réelle. Si Docker ou PostgreSQL restent indisponibles dans le sandbox courant, cet état sera marqué `BLOCKED — raison exacte`.

## Contraintes de sécurité

Aucun secret réel ne sera ajouté au dépôt. Les exemples utiliseront uniquement des placeholders. Les tests et logs ne devront pas afficher les mots de passe, les URL contenant des secrets ni les tokens OAuth.
