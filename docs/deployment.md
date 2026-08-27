# Déploiement

Le `docker-compose.yml` fournit une cible autonome avec PostgreSQL 16, un volume persistant, un réseau interne et des healthchecks. Le backend est construit par `docker/backend.Dockerfile`. Les valeurs sensibles sont injectées au lancement et ne doivent jamais être commitées.

Le runtime géré actuel utilise sa base SQL intégrée et l’identité Manus OAuth. La cible PostgreSQL Docker est donc documentée et préparée, mais son activation complète nécessite l’adaptation du driver et de la migration dans un environnement autonome.
