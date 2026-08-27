# Validation PostgreSQL — Étape 4.1

## Résumé

La consolidation applicative vers PostgreSQL est **IMPLEMENTED** et la validation statique est **TESTED**. Le schéma Drizzle, le driver, la configuration, les dépendances, Compose et la chaîne de migration sont alignés. La validation d’intégration Docker/PostgreSQL/Prometheus reste **BLOCKED — `docker`, `podman` et `nerdctl` ne sont pas installés dans le sandbox courant**. Aucune preuve de persistance réelle n’est inventée pour compenser cette limite.

## Matrice de résultats

| Contrôle | Résultat | Preuve |
|---|---|---|
| Drizzle PostgreSQL | TESTED | `drizzle/schema.ts` utilise `pgTable`, `pgEnum`, `pg-core` et des identités PostgreSQL |
| Driver runtime | TESTED | `server/db.ts` utilise `drizzle-orm/node-postgres`, `Pool` et `.returning()` |
| Dépendances | TESTED | `mysql2` supprimé des dépendances directes et des imports ; `pg` et `@types/pg` utilisés. Le lockfile peut conserver une référence peer transitive de Drizzle, sans usage applicatif. |
| Configuration migrations | TESTED | `drizzle.config.ts` utilise `dialect: "postgresql"` et `drizzle-pg/` |
| Migration vierge | TESTED par inspection et test d’invariants | `drizzle-pg/0000_perfect_tyrannus.sql`, 19 tables, types enum, identités, FK et index PostgreSQL |
| Exemple environnement | TESTED | `DATABASE_URL` PostgreSQL vers `postgres:5432`, variables `POSTGRES_*` et Prometheus documentées |
| Docker Compose | BLOCKED | Aucun runtime conteneur installé dans l’environnement de validation |
| PostgreSQL healthy | BLOCKED | Impossible de démarrer la stack dans l’environnement courant |
| Migration persistante réelle | BLOCKED | Aucune instance PostgreSQL de test disponible |
| Backend → PostgreSQL | BLOCKED | Connexion réelle non exécutable ici ; les URL non PostgreSQL sont refusées explicitement |
| Prometheus/Node Exporter | BLOCKED | Aucun démarrage inter-services possible ici |
| API sans session | TESTED | `GET /api/alerts` retourne `401` ; `GET /` retourne `200` |
| Tests unitaires et contrats | TESTED | `pnpm validate` : 15 fichiers, 69 tests passés |
| TypeScript | TESTED | `pnpm check` réussi |
| Build production | TESTED | Vite et esbuild réussis ; avertissement de taille de chunk non bloquant |

## Fichiers principaux modifiés

Le schéma et l’accès aux données sont dans `drizzle/schema.ts`, `server/db.ts`, `drizzle.config.ts` et `drizzle-pg.config.ts`. La migration complète est `drizzle-pg/0000_perfect_tyrannus.sql`. La cible autonome est alignée dans `docker-compose.yml`. Les guides courants sont `README.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/api-inventory.md`, `docs/rbac.md`, `docs/env.example.md`, `docs/installation.md`, `docs/deployment.md` et `docs/troubleshooting.md`. Le contrôle déterministe est couvert par `server/postgres.migration.test.ts`.

## Réserve de compatibilité

Les migrations MySQL historiques restent sous `drizzle/` et ne doivent pas être appliquées sur PostgreSQL. Le runtime géré du sandbox fournit encore une `DATABASE_URL` incompatible ; le garde-fou du helper DB la refuse au lieu d’émettre des requêtes dans le mauvais dialecte. Dans un environnement Fedora disposant réellement de Docker, la preuve à produire est : PostgreSQL healthy, migration depuis zéro, requête persistante, backend healthy, Prometheus healthy, scrape `node-exporter:9100`, cible `UP`, puis chaîne monitoring/alerte/incident.
