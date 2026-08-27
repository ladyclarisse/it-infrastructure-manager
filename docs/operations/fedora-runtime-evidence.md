# Protocole de collecte des preuves Fedora — Étape 5.2

Ce document encadre uniquement la collecte réalisée sur l’hôte Fedora de l’utilisateur. Le sandbox Manus ne peut pas produire ces preuves à distance. Tant que les sorties ci-dessous ne sont pas reçues, chaque domaine Fedora conserve le statut **À MESURER** ou **BLOCKED — exécution Fedora réelle requise**.

## Règles de collecte

Ne transmettre aucune valeur de `POSTGRES_PASSWORD`, `JWT_SECRET`, secret OAuth, token privé, clé API, cookie de session, URL signée ou donnée personnelle. Ne pas transmettre `.env.local`. Les sorties JSON Prometheus doivent être expurgées des labels ou valeurs sensibles avant envoi. Les commandes de ce protocole ne suppriment pas de volume et ne désactivent ni OAuth ni RBAC.

## Preuves d’environnement et Compose

Depuis la racine du dépôt, transmettre les sorties de commandes suivantes, en conservant les erreurs si elles apparaissent :

```bash
git status
git log -5 --oneline
git branch --show-current
docker --version
docker compose version
docker info --format 'Server={{.ServerVersion}} OSType={{.OSType}} Architecture={{.Architecture}}'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker compose -p it-infrastructure-manager config --quiet
docker compose -p it-infrastructure-manager ps
```

La preuve attendue est un daemon accessible, un Compose valide et les services `postgres`, `backend`, `frontend`, `prometheus` et `node-exporter` visibles. Ne pas remplacer une sortie absente par une hypothèse.

## Preuves PostgreSQL et migrations

Après démarrage avec `docker compose -p it-infrastructure-manager up -d --build`, transmettre uniquement les statuts et résultats non sensibles :

```bash
docker compose -p it-infrastructure-manager ps postgres backend frontend
docker compose -p it-infrastructure-manager exec -T postgres pg_isready -U "${POSTGRES_USER:-it_manager}" -d "${POSTGRES_DB:-it_infrastructure}"
docker compose -p it-infrastructure-manager exec -T backend pnpm drizzle-kit migrate --config=drizzle-pg.config.ts
docker compose -p it-infrastructure-manager exec -T postgres psql -U "${POSTGRES_USER:-it_manager}" -d "${POSTGRES_DB:-it_infrastructure}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```

Avant toute donnée métier de test, transmettre le nombre de lignes uniquement :

```bash
docker compose -p it-infrastructure-manager exec -T postgres psql -U "${POSTGRES_USER:-it_manager}" -d "${POSTGRES_DB:-it_infrastructure}" -c "SELECT count(*) AS assets FROM assets; SELECT count(*) AS monitoring_targets FROM monitoring_targets; SELECT count(*) AS alert_rules FROM alert_rules; SELECT count(*) AS alerts FROM alerts; SELECT count(*) AS incidents FROM incidents; SELECT count(*) AS audit_logs FROM audit_logs;"
```

## Preuves backend, frontend et sécurité

```bash
curl --silent --show-error -o /tmp/step52-root.body -w 'root_status=%{http_code}\n' http://localhost:3000/
curl --silent --show-error -o /dev/null -w 'monitoring_anonymous_status=%{http_code}\n' http://localhost:3000/api/monitoring/targets
curl --silent --show-error -o /dev/null -w 'alerts_anonymous_status=%{http_code}\n' http://localhost:3000/api/alerts
curl --silent --show-error -o /dev/null -w 'incidents_anonymous_status=%{http_code}\n' http://localhost:3000/api/incidents
curl --silent --show-error -o /dev/null -w 'frontend_status=%{http_code}\n' http://localhost:8080/
```

Les résultats attendus sont `200` pour le backend `/` et le frontend, et `401` pour les trois routes API protégées sans session. Une session autorisée peut être utilisée pour les scénarios métier, mais son cookie ne doit jamais être transmis.

## Preuves Prometheus et Node Exporter

```bash
docker compose -p it-infrastructure-manager ps prometheus node-exporter
curl --fail-with-body --silent --show-error http://localhost:9090/-/healthy
curl --fail-with-body --silent --show-error http://localhost:9090/api/v1/targets > /tmp/step52-targets.json
curl --fail-with-body --silent --show-error --get --data-urlencode 'query=up{job="node-exporter"}' http://localhost:9090/api/v1/query > /tmp/step52-up.json
```

Renvoyer les statuts HTTP et un extrait expurgé montrant la présence de la cible, son `health`, son `lastError` vide si elle est saine, et la valeur PromQL `1`. Ne jamais déclarer `UP` à partir de la configuration seule.

## Preuves Alert → Incident → Audit

Depuis une session autorisée, exécuter le mécanisme existant d’initialisation et d’évaluation des règles ; ne pas insérer directement une alerte ou un incident par SQL. Renvoyer seulement les identifiants non sensibles, les états, le fingerprint tronqué ou haché, et les comptes de lignes. La preuve recherchée est : une condition PromQL réelle observée, une alerte persistée une seule fois, un incident corrélé une seule fois, une ligne d’historique et un audit correspondant.

Répéter l’évaluation sans modifier la condition et relever l’absence de doublon. Tester les transitions autorisées avec le compte autorisé, puis une transition incohérente qui doit être refusée sans bypass.

## Preuves restart et persistance

Avant le restart, transmettre les comptes de lignes et les identifiants non sensibles du scénario :

```bash
docker compose -p it-infrastructure-manager exec -T postgres psql -U "${POSTGRES_USER:-it_manager}" -d "${POSTGRES_DB:-it_infrastructure}" -c "SELECT count(*) AS alert_rules FROM alert_rules; SELECT count(*) AS alerts FROM alerts; SELECT count(*) AS incidents FROM incidents; SELECT count(*) AS incident_history FROM incident_history; SELECT count(*) AS audit_logs FROM audit_logs;"
docker compose -p it-infrastructure-manager restart backend postgres prometheus node-exporter
docker compose -p it-infrastructure-manager ps
```

Après healthchecks, répéter les mêmes comptes et les contrôles Prometheus. La persistance est **PASS** uniquement si les comptes, relations et états attendus restent cohérents avant et après restart. Ne jamais exécuter `docker compose down -v` dans ce protocole.

## Format de retour recommandé

Retourner un tableau comportant `Domaine`, `Commande`, `Résultat`, `Statut` et `Secret expurgé`. Les statuts autorisés sont `PASS` pour une preuve réellement observée, `FAIL` pour une preuve réellement incorrecte, `BLOCKED` lorsque la commande ne peut pas être exécutée et `À MESURER` avant transmission des sorties. Le rapport final ne convertira aucun statut Fedora en `PASS` par inférence.
