# Exemple d’environnement

Les variables suivantes sont nécessaires à une installation autonome. Les valeurs ci-dessous sont des placeholders et ne doivent jamais être réutilisées en production.

```dotenv
NODE_ENV=development
DATABASE_URL=postgresql://it_manager:replace-with-a-local-secret@postgres:5432/it_infrastructure
JWT_SECRET=replace-with-a-random-value
VITE_APP_ID=replace-with-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=replace-with-owner-open-id
POSTGRES_DB=it_infrastructure
POSTGRES_USER=it_manager
POSTGRES_PASSWORD=replace-with-a-local-secret
# Le backend Docker construit aussi DATABASE_URL vers postgres:5432 à partir de ces variables.
PROMETHEUS_URL=http://prometheus:9090
PROMETHEUS_TIMEOUT_MS=3000
MONITORING_ENABLED=true
```

Dans le projet géré, les variables d’environnement et secrets sont injectés par la configuration sécurisée ; aucun fichier `.env.example` n’est modifié directement.
