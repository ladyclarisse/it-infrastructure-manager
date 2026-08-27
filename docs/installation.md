# Installation

Le projet géré démarre avec `pnpm install` puis `pnpm dev`. La validation locale s’exécute avec `pnpm check && pnpm test`. L’identité est fournie par Manus OAuth ; l’environnement doit donc exposer les variables listées dans la configuration du projet.

Pour l’environnement Docker, fournir les variables hors Git, lancer `docker compose up --build`, puis vérifier le healthcheck PostgreSQL et la réponse HTTP du backend. Les données PostgreSQL utilisent le volume `postgres_data`.
