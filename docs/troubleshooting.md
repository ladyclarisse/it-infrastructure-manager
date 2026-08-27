# Dépannage

## Authentification et autorisation

Si la console affiche l’écran de connexion, vérifier la session OAuth et les variables `VITE_APP_ID`, `OAUTH_SERVER_URL` et `VITE_OAUTH_PORTAL_URL`. Une procédure qui répond `UNAUTHORIZED` indique une session absente ou expirée. Une réponse `FORBIDDEN` indique que le rôle serveur ne possède pas la permission requise ; le contrôle frontend ne constitue jamais une barrière suffisante.

## PostgreSQL et node-postgres

L’application utilise désormais `drizzle-orm/node-postgres` avec un `Pool` initialisé depuis `DATABASE_URL`. Dans Docker, cette URL doit cibler `postgres:5432`, et non `localhost`. Vérifier que `POSTGRES_DB`, `POSTGRES_USER` et `POSTGRES_PASSWORD` sont présents, puis que le healthcheck `pg_isready` est vert.

Une erreur `ECONNREFUSED` signifie généralement que PostgreSQL n’est pas démarré, que le hostname est incorrect ou que le backend démarre avant le healthcheck. Une erreur d’authentification PostgreSQL indique une divergence entre les variables du service `postgres` et l’URL construite pour le backend. Ne pas imprimer l’URL complète si elle contient un mot de passe.

La chaîne de migrations PostgreSQL se trouve dans `drizzle-pg/`. Les migrations historiques MySQL sous `drizzle/` ne doivent pas être exécutées sur PostgreSQL : leurs backticks, `AUTO_INCREMENT`, enums inline et `ON UPDATE` ne sont pas du DDL PostgreSQL. Après démarrage d’une base vierge, exécuter `pnpm drizzle-kit migrate` avec une `DATABASE_URL` PostgreSQL, puis vérifier les tables et contraintes par une requête en lecture seule.

## Docker et monitoring

Si `docker`, `podman` ou `nerdctl` est absent, la validation inter-services est `BLOCKED — runtime conteneur indisponible`. Dans ce cas, ne pas remplacer Prometheus, Node Exporter ou les données persistées par des mocks présentés comme une preuve runtime. Sur une machine conteneurisée, vérifier les healthchecks PostgreSQL, backend, Prometheus et Node Exporter, puis confirmer `/metrics`, `/-/healthy` et une requête `up` réelle.

## Type-check et tests

La validation statique est `pnpm check && pnpm test && pnpm build`, ou `pnpm validate` si le script est disponible. Les tests avec doubles de service prouvent la logique et les contrats ; ils ne prouvent pas une migration PostgreSQL ni la persistance multi-services. Ces deux niveaux doivent rester distingués dans le rapport d’audit.
