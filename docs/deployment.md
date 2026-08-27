# Déploiement

Le `docker-compose.yml` fournit une cible autonome avec **PostgreSQL 16**, un volume persistant, un réseau interne et des healthchecks. Le backend est construit par `docker/backend.Dockerfile` et reçoit une `DATABASE_URL` interne de la forme `postgresql://...@postgres:5432/...`. Prometheus et Node Exporter restent sur le même réseau privé. Les valeurs sensibles sont injectées au lancement et ne doivent jamais être commitées.

L’application utilise désormais **Drizzle PostgreSQL** et `node-postgres` (`pg`). Les migrations applicatives PostgreSQL sont générées dans `drizzle-pg/`. Les migrations historiques MySQL sous `drizzle/` sont conservées pour traçabilité et ne doivent pas être exécutées sur PostgreSQL.

## Démarrage autonome

```bash
export POSTGRES_DB=it_infrastructure
export POSTGRES_USER=it_manager
export POSTGRES_PASSWORD='<LOCAL_SECRET>'
export JWT_SECRET='<LOCAL_SECRET>'
export OAUTH_SERVER_URL=https://api.manus.im
docker compose -p it-infrastructure-manager up --build -d
```

Le backend construit l’URL PostgreSQL à partir des variables `POSTGRES_*` et utilise le hostname Compose `postgres`, jamais `localhost`. Après démarrage, vérifier séparément `docker compose -p it-infrastructure-manager ps`, les cinq healthchecks, les logs backend, puis exécuter la migration PostgreSQL depuis une base vierge avec `pnpm drizzle-kit migrate`.

Une validation PostgreSQL n’est déclarée **TESTED** qu’après connexion réelle, migration réelle, requête réelle et réponse backend réelle. Si le runtime Docker n’est pas installé dans l’environnement d’exécution courant, le statut est `BLOCKED — runtime Docker indisponible`.
