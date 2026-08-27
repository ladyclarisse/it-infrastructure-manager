# Installation

Pour le développement applicatif sans stack conteneurisée, installer les dépendances avec `pnpm install`, renseigner une `DATABASE_URL` PostgreSQL accessible, puis lancer `pnpm dev`. L’identité est fournie par Manus OAuth ; l’environnement doit exposer les variables listées dans `docs/env.example.md`.

Pour l’environnement Docker, partir du modèle non secret `.env.local.example`, le copier localement vers `.env.local`, remplacer les placeholders uniquement sur la machine de développement et ne jamais committer `.env.local`. La variable `DATABASE_URL` doit cibler `postgres:5432` depuis le backend. Lancer ensuite la stack sous un nom explicite afin d’éviter toute collision avec d’autres projets :

```bash
docker compose -p it-infrastructure-manager up --build -d
docker compose -p it-infrastructure-manager ps
```

La base PostgreSQL est le service `postgres`, le backend utilise `postgres:5432`, et les données résident dans le volume `postgres_data`. La chaîne de migrations PostgreSQL est `drizzle-pg/`; les fichiers historiques MySQL sous `drizzle/` sont conservés mais ne doivent pas être appliqués à PostgreSQL.

Après démarrage, vérifier `pg_isready`, le healthcheck backend, la disponibilité de Prometheus, les métriques Node Exporter et les logs backend. Exécuter ensuite `pnpm drizzle-kit migrate`, puis une requête applicative réelle. Les statuts `TESTED` ne peuvent être déclarés qu’après ces preuves ; sinon consigner `BLOCKED — <raison exacte>`.

La validation statique du dépôt s’exécute avec `pnpm check && pnpm test && pnpm build`, ou avec `pnpm validate`.
