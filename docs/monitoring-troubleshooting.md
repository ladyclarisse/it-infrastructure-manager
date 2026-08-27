# Dépannage monitoring

## `Monitoring backend unavailable`

Ce message signifie que le backend n’a pas obtenu une réponse valide de `PROMETHEUS_URL` dans le délai `PROMETHEUS_TIMEOUT_MS`. Vérifier la résolution DNS, le réseau Docker interne, l’état de santé du service Prometheus et la présence de la configuration montée dans `/etc/prometheus/prometheus.yml`.

## Target `UNKNOWN`

`UNKNOWN` ne signifie pas automatiquement que la machine est arrêtée. Il peut indiquer une série `up` absente, une métrique non disponible ou une observation impossible. Si Prometheus répond avec `up = 0`, l’état devient `DOWN`. Si la target est désactivée, l’état reste `NOT_CONFIGURED` et aucun appel Prometheus n’est réalisé.

## Node Exporter absent

Vérifier le healthcheck du conteneur, l’endpoint interne `http://node-exporter:9100/metrics`, le job `node-exporter` et la cible `node-exporter:9100` dans Prometheus. Pour une VM externe, vérifier le firewall et la connectivité depuis le réseau du collecteur sans exposer le port publiquement.

## Métrique `null`

Le service ne remplace pas une métrique absente par zéro. Vérifier la version de Node Exporter, le nom de la métrique et les labels `instance` disponibles dans Prometheus. Les requêtes sont centralisées dans `server/services/monitoring.ts`.

## Sécurité et SSRF

Une erreur `400` sur l’endpoint indique généralement un schéma, un chemin, un caractère interdit, un hostname invalide ou un port hors limites. Les handlers ne contactent jamais l’endpoint fourni par l’utilisateur ; ils interrogent uniquement l’URL Prometheus configurée par l’environnement. Les mutations nécessitent un rôle d’administration d’inventaire.

## Logs

Les logs applicatifs utilisent le préfixe `[Monitoring]` pour les erreurs de requête Prometheus et les réponses HTTP non valides. Les audits portent uniquement sur les changements de configuration des targets ; les métriques ne créent pas de logs d’audit.
