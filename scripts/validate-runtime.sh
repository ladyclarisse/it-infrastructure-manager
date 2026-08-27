#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT="${COMPOSE_PROJECT_NAME:-it-infrastructure-manager}"
COMPOSE=(docker compose -p "$PROJECT")
required=(POSTGRES_PASSWORD JWT_SECRET OAUTH_SERVER_URL)

fail() { printf 'BLOCKED/FAIL: %s\n' "$*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || fail "commande absente: $1"; }

need_cmd docker
docker info >/dev/null || fail "daemon Docker inaccessible"
docker compose version >/dev/null || fail "Docker Compose indisponible"

if [[ ! -f .env.local ]]; then
  fail ".env.local absent; copier .env.local.example, remplacer les placeholders localement et chmod 600"
fi
set -a
source .env.local
set +a
for key in "${required[@]}"; do
  value="${!key-}"
  [[ -n "$value" && "$value" != "<LOCAL_SECRET>" && "$value" != "<SECRET>" ]] || fail "$key absent ou placeholder dans l'environnement"
done

"${COMPOSE[@]}" config >/dev/null
"${COMPOSE[@]}" up -d --build
"${COMPOSE[@]}" ps

"${COMPOSE[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER:-it_manager}" -d "${POSTGRES_DB:-it_infrastructure}"
curl --fail-with-body --silent --show-error http://localhost:3000/ >/dev/null
for path in /api/monitoring/targets /api/alerts /api/incidents; do
  status="$(curl --silent --show-error -o /dev/null -w '%{http_code}' "http://localhost:3000${path}")"
  [[ "$status" == "401" ]] || fail "$path doit répondre 401 sans session, reçu $status"
done

curl --fail-with-body --silent --show-error http://localhost:9090/-/healthy >/dev/null
curl --fail-with-body --silent --show-error http://localhost:9090/api/v1/targets >/tmp/it-manager-prometheus-targets.json
curl --fail-with-body --silent --show-error --get --data-urlencode 'query=up{job="node-exporter"}' http://localhost:9090/api/v1/query >/tmp/it-manager-prometheus-up.json

grep -q '"job":"node-exporter"' /tmp/it-manager-prometheus-targets.json || fail "cible node-exporter absente de Prometheus"
grep -q '"value":\[.*,"1"\]' /tmp/it-manager-prometheus-up.json || fail "cible node-exporter non UP selon PromQL"

printf 'PASS: Docker, Compose, PostgreSQL, backend, auth boundary, Prometheus et Node Exporter vérifiés.\n'
printf 'Prometheus outputs saved to /tmp/it-manager-prometheus-{targets,up}.json; no secret values were printed.\n'
printf 'Next: apply drizzle-pg migrations and execute the authenticated Alert → Incident → Audit persistence scenario from docs/runbook-validation-fedora.md.\n'
