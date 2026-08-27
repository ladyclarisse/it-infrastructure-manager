# Runbook de validation Fedora — Étape 5.1

Ce runbook est destiné à l’environnement Fedora local disposant de Docker. Il complète la validation sandbox Manus sans la remplacer. Les résultats Fedora ne doivent être marqués **PASS** qu’après conservation des sorties réelles des commandes ; aucune sortie n’est fournie ou supposée par ce document.

## 1. Préparer l’environnement sans exposer de secret

Depuis la racine du dépôt, vérifier que la branche et le commit attendus sont présents. Ne pas réinitialiser les volumes existants et ne jamais afficher les valeurs de `POSTGRES_PASSWORD`, `JWT_SECRET` ou des cookies OAuth.

```bash
git status
git log -3 --oneline
git branch --show-current
git show --stat --oneline b144a77
cp .env.local.example .env.local
$EDITOR .env.local
chmod 600 .env.local
```

Dans `.env.local`, remplacer chaque placeholder localement. Depuis le réseau Compose, `DATABASE_URL` doit utiliser `postgres`, et `PROMETHEUS_URL` doit utiliser `prometheus` : `localhost` ne doit pas être utilisé pour les communications inter-conteneurs. Le modèle est volontairement non secret et ne doit pas être remplacé par une valeur réelle dans Git.

## 2. Vérifier Docker et le contrat Compose

Exécuter les quatre contrôles d’environnement demandés, puis inspecter la configuration résolue sans afficher le contenu de `.env.local`.

```bash
docker --version
docker compose version
docker info
docker ps
docker compose -p it-infrastructure-manager config
```

Le résultat attendu est un daemon accessible, un projet Compose valide et les services `postgres`, `backend`, `prometheus` et `node-exporter` résolus par leurs noms DNS de service. Si `docker info` échoue, arrêter la procédure et retourner sa sortie complète hors secrets.

Démarrer la stack sans supprimer de volume :

```bash
docker compose -p it-infrastructure-manager up -d --build
docker compose -p it-infrastructure-manager ps
docker compose -p it-infrastructure-manager logs --tail=120 postgres backend prometheus node-exporter
```

## 3. Vérifier PostgreSQL et appliquer les migrations

Le service PostgreSQL est joignable depuis le réseau Compose sous `postgres`. Vérifier d’abord son healthcheck et son accès interne sans publier le mot de passe dans le terminal ou le rapport.

```bash
docker compose -p it-infrastructure-manager exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
docker compose -p it-infrastructure-manager ps postgres
```

La chaîne active est `drizzle-pg/`; les migrations historiques sous `drizzle/` ne doivent pas être appliquées. Depuis le conteneur backend, la commande exacte utilise la configuration PostgreSQL dédiée :

```bash
docker compose -p it-infrastructure-manager exec -T backend pnpm drizzle-kit migrate --config=drizzle-pg.config.ts
```

Si le service backend n’embarque pas les outils de développement, exécuter la migration depuis la racine du dépôt Fedora avec `DATABASE_URL` temporairement exportée vers l’URL Compose, sans l’imprimer :

```bash
set -a
source .env.local
set +a
pnpm drizzle-kit migrate --config=drizzle-pg.config.ts
unset DATABASE_URL POSTGRES_PASSWORD JWT_SECRET
```

Vérifier les tables attendues depuis PostgreSQL. La requête ne retourne ni secret ni donnée métier sensible :

```bash
docker compose -p it-infrastructure-manager exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\dt'
docker compose -p it-infrastructure-manager exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users','assets','monitoring_targets','alert_rules','alerts','incidents','incident_history','audit_logs') ORDER BY table_name;"
```

## 4. Vérifier le backend et l’authentification

Le backend expose son port applicatif selon `docker-compose.yml`. Vérifier d’abord la disponibilité publique et conserver les codes HTTP :

```bash
curl --fail-with-body --silent --show-error -D /tmp/it-manager-root.headers -o /tmp/it-manager-root.body http://localhost:3000/
curl --silent --show-error -o /tmp/it-manager-monitoring.body -w 'monitoring_status=%{http_code}\n' http://localhost:3000/api/monitoring/targets
curl --silent --show-error -o /tmp/it-manager-alerts.body -w 'alerts_status=%{http_code}\n' http://localhost:3000/api/alerts
curl --silent --show-error -o /tmp/it-manager-incidents.body -w 'incidents_status=%{http_code}\n' http://localhost:3000/api/incidents
```

Le résultat attendu est `200` pour `/` et `401 UNAUTHORIZED` pour les routes protégées sans session. Ne pas créer de bypass OAuth/RBAC. Une authentification complète nécessite une session Manus valide ; si elle n’est pas disponible sur Fedora, documenter cette limitation et utiliser les tests de contrat existants pour l’absence de session.

## 5. Vérifier Prometheus et Node Exporter

Vérifier les healthchecks et la résolution DNS interne depuis le réseau Compose :

```bash
docker compose -p it-infrastructure-manager ps prometheus node-exporter
docker compose -p it-infrastructure-manager exec -T prometheus wget -qO- http://prometheus:9090/-/healthy
curl --fail-with-body --silent --show-error http://localhost:9090/-/healthy
curl --fail-with-body --silent --show-error http://localhost:9090/api/v1/targets > /tmp/it-manager-targets.json
curl --fail-with-body --silent --show-error --get --data-urlencode 'query=up{job="node-exporter"}' http://localhost:9090/api/v1/query > /tmp/it-manager-up.json
```

Le résultat attendu est une réponse healthy, une cible `node-exporter` visible et un résultat PromQL réel dont la valeur `up` est `1`. Le rapport Fedora doit joindre les fichiers JSON ou leurs extraits expurgés, avec horodatage, sans token ni mot de passe. Si Prometheus n’est pas publié sur `localhost:9090`, exécuter les appels depuis le conteneur Prometheus ou utiliser le port réellement déclaré par Compose, sans modifier la configuration pour contourner le réseau.

## 6. Déclencher et vérifier une Alert Rule réelle

Initialiser les quatre règles de référence depuis une session autorisée via l’interface Alerts ou la procédure tRPC existante. Ne pas insérer directement une alerte dans PostgreSQL et ne pas lancer un moteur parallèle. Le mécanisme attendu est celui du service Alerting : évaluation PromQL réelle, fingerprint déterministe, déduplication et persistance.

Après identification d’une règle de référence et d’une cible réellement `UP`, appeler l’API protégée avec une session autorisée ou utiliser l’écran Alerts. Conserver l’identifiant de règle et l’instant UTC. Pour une condition contrôlée, utiliser uniquement une règle PromQL autorisée déjà supportée par le service et documenter sa définition exacte. Vérifier ensuite, par lecture authentifiée ou requête PostgreSQL en lecture seule, que l’état observé et le fingerprint correspondent à une seule ligne persistée.

Répéter l’évaluation sans modifier la condition. L’absence de seconde ligne pour le même fingerprint démontre l’idempotence. Toute réponse `UNKNOWN`, timeout Prometheus ou absence de données doit rester un état explicite et ne doit pas être convertie en `FIRING`.

## 7. Vérifier la corrélation Incident et l’audit

Depuis la même session autorisée, utiliser l’alerte réelle et le mécanisme existant de corrélation :

```bash
curl --silent --show-error --cookie "$SESSION_COOKIE" http://localhost:3000/api/alerts
curl --silent --show-error --cookie "$SESSION_COOKIE" http://localhost:3000/api/incidents
```

Remplacer `$SESSION_COOKIE` uniquement dans l’environnement local ; ne jamais le mettre dans une commande copiée dans le rapport. Vérifier que la séquence est `Alert → Incident → incident_history → audit_logs`, que les identifiants et clés étrangères correspondent, et qu’une seconde corrélation ne crée pas de doublon. Tester ensuite les transitions autorisées `ACKNOWLEDGED`, `RESOLVED`, `CLOSED` et confirmer qu’une transition incohérente est refusée par le service.

## 8. Tester la persistance après redémarrage

Ne pas utiliser `down -v` et ne pas supprimer le volume `postgres_data`. Avant redémarrage, relever uniquement les comptes de lignes et identifiants nécessaires :

```bash
docker compose -p it-infrastructure-manager exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(*) AS alerts FROM alerts; SELECT count(*) AS incidents FROM incidents; SELECT count(*) AS audit_logs FROM audit_logs;"
docker compose -p it-infrastructure-manager restart backend postgres prometheus node-exporter
docker compose -p it-infrastructure-manager ps
```

Attendre les healthchecks, relancer les contrôles HTTP, puis répéter les requêtes de comptage. Les lignes et relations créées par le scénario doivent rester présentes. Si PostgreSQL nécessite un temps de démarrage, attendre plutôt que recréer ou supprimer le volume.

## 9. Matrice de preuves à retourner

| Vérification | Sandbox Manus | Fedora Docker | Preuve à retourner |
|---|---|---|---|
| `pnpm validate` | PASS, 16 fichiers, 72 tests | À rejouer | Sortie complète de la commande |
| TypeScript / build | PASS | À rejouer | Sortie sans secrets |
| Docker daemon | BLOCKED | À mesurer | `docker info` résumé |
| PostgreSQL healthy | BLOCKED | À mesurer | `pg_isready` et `docker compose ps` |
| Migrations `drizzle-pg` | BLOCKED | À mesurer | commande + `\dt` |
| Backend → PostgreSQL | BLOCKED | À mesurer | logs ciblés + requête applicative |
| Prometheus / Node Exporter | BLOCKED | À mesurer | healthcheck + `targets.json` |
| Target `UP` / PromQL | BLOCKED | À mesurer | `up.json` |
| Alert Rule | BLOCKED | À mesurer | identifiant, fingerprint, état |
| Incident / History / Audit | BLOCKED | À mesurer | identifiants et comptes de lignes |
| Restart / persistance | BLOCKED | À mesurer | comptes avant/après |

## 10. Sorties à renvoyer

Renvoyer les sorties de `docker --version`, `docker compose version`, `docker info` résumé, `docker compose config` sans secrets, `docker compose ps`, les healthchecks, la commande de migration, les cinq statuts HTTP, les réponses Prometheus, les comptes PostgreSQL avant/après restart et les identifiants non sensibles du scénario Alert → Incident. Masquer les mots de passe, JWT, cookies, Bearer tokens, URLs signées et toute donnée personnelle. Ne pas renvoyer `.env.local`.

Le statut Fedora reste **À MESURER** jusqu’à réception de ces sorties. Ce runbook ne déclare aucune validation Docker, PostgreSQL, Prometheus, Alert ou Incident comme réussie à l’avance.
