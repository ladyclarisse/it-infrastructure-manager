# Étape 5.3 — Correction du build Docker bloqué par le patch pnpm

## Résumé

Le premier build Fedora communiqué par l’utilisateur a échoué avec `ENOENT: no such file or directory, open '/app/patches/wouter@3.7.1.patch'`. L’audit du dépôt confirme la cause : les Dockerfiles copiaient `package.json` et `pnpm-lock.yaml`, puis lançaient `pnpm install`, avant de copier le reste du contexte avec `COPY . .`. Le dossier `patches/` n’était donc pas disponible au moment où pnpm résolvait `patchedDependencies`.

Le correctif conserve `patchedDependencies`, le fichier `patches/wouter@3.7.1.patch` et `--frozen-lockfile`. Il ajoute `COPY patches ./patches` avant chaque `pnpm install` dans le Dockerfile backend, y compris l’installation de production, ainsi qu’avant l’installation du Dockerfile frontend. Un `.dockerignore` minimal exclut les artefacts locaux mais ne contient aucune règle excluant `patches/`.

## État de validation

| Contrôle | Résultat | Preuve |
|---|---|---|
| Cause ENOENT identifiée | PASS | Ordre initial `COPY package.json pnpm-lock.yaml` → `pnpm install` → `COPY . .` confirmé dans les deux Dockerfiles. |
| Patch pnpm conservé | PASS | `package.json` conserve `patchedDependencies` et `patches/wouter@3.7.1.patch` est présent. |
| Backend build install | PASS par inspection/test | `COPY patches ./patches` précède `RUN pnpm install --frozen-lockfile`. |
| Backend runtime install | PASS par inspection/test | `COPY patches ./patches` précède `RUN pnpm install --prod --frozen-lockfile`. |
| Frontend build install | PASS par inspection/test | `COPY patches ./patches` précède `RUN pnpm install --frozen-lockfile`. |
| `.dockerignore` | PASS par inspection/test | Le fichier exclut `node_modules`, `dist`, secrets et Git ; aucune règle `patches/` n’est présente. |
| `pnpm validate` | PASS | 17 fichiers de tests, 77 tests passés, TypeScript et build réussis. |
| Docker build Fedora après correctif | FAIL | Preuve Fedora fournie : `backend runtime` échoue encore sur `pnpm install --prod --frozen-lockfile` avec ENOENT `/app/patches/wouter@3.7.1.patch`. |
| Docker Compose healthchecks | À MESURER | Le build ayant échoué, aucun démarrage/healthcheck post-correctif n’est qualifiable. |
| PostgreSQL réel et migrations | BLOCKED | Le démarrage Docker seul ne prouve pas les migrations ni la persistance PostgreSQL. |
| Prometheus / Node Exporter / target UP | BLOCKED | Aucun résultat runtime réel fourni après le correctif. |
| Alert → Incident → Audit | BLOCKED | Aucun scénario runtime réel fourni après le correctif. |
| Restart / persistance | BLOCKED | Aucun comparatif avant/après restart fourni. |

## Diagnostic de divergence à résoudre

Le dépôt courant audité dans cette session contient bien `COPY patches ./patches` avant l’installation du stage backend runtime, aux côtés de la même correction dans les stages backend build et frontend build. Toutefois, le log Fedora fourni montre explicitement un `backend.Dockerfile` effectif sans cette instruction. La conclusion prudente est que le build Fedora a utilisé un checkout, un commit, un contexte ou une copie de fichier différente de l’état courant ; cette divergence doit être vérifiée avant tout reclassement en PASS. Le test de régression contrôle maintenant chaque `RUN pnpm install` et la présence réelle du fichier patch dans le dépôt.

## Commandes Fedora à exécuter

Sur l’hôte Fedora, depuis la racine du dépôt et avec `.env.local` déjà configuré sans transmettre ses secrets, exécuter :

```bash
docker compose --env-file .env.local build --no-cache backend frontend
docker compose --env-file .env.local up -d
docker compose --env-file .env.local ps
docker compose --env-file .env.local ps --format 'table {{.Name}}\t{{.Service}}\t{{.Status}}\t{{.Ports}}'
docker compose --env-file .env.local logs --tail=50 postgres
docker compose --env-file .env.local logs --tail=50 backend
docker compose --env-file .env.local logs --tail=50 frontend
docker compose --env-file .env.local logs --tail=50 prometheus
docker compose --env-file .env.local logs --tail=50 node-exporter
```

Le build Docker reste **FAIL** selon la preuve Fedora actuellement fournie. Il pourra être requalifié **PASS** seulement après synchronisation vers l’état courant, exécution de cette commande sans l’ENOENT et construction effective des images backend et frontend. Les healthchecks seront qualifiés séparément à partir de `docker compose ps`; ils ne seront pas déduits du succès du build.

## Preuves Fedora reçues et limites de provenance

L’utilisateur a communiqué les prérequis Fedora suivants : Fedora 44, Docker 29.7.2, Docker Compose v5.5.0, daemon actif, `overlayfs`, et téléchargement des images PostgreSQL 16, Prometheus 2.55.1 et Node Exporter 1.8.2. Ces éléments sont enregistrés comme **informations fournies par l’utilisateur**, et non comme commandes observées ou exécutées par cette session. Le sandbox courant ne dispose toujours pas du binaire Docker ; aucune preuve de rebuild post-correctif ne peut donc être attribuée à l’environnement courant.

Même si le rebuild et le démarrage réussissent sur Fedora, cette étape ne qualifiera pas automatiquement PostgreSQL, Prometheus, les alertes, les incidents, l’audit ou la persistance. Ces contrôles nécessitent les commandes et comparaisons réelles du runbook Étape 5.2, notamment les migrations sur base vierge, la requête PromQL, la cible `UP`, la persistance Alert → Incident → Audit et le restart contrôlé.

## Fichiers modifiés

| Fichier | Modification |
|---|---|
| `docker/backend.Dockerfile` | Copie du patch avant installation build et runtime. |
| `docker/frontend.Dockerfile` | Copie du patch avant installation build. |
| `.dockerignore` | Exclusions locales sans exclusion de `patches/`. |
| `server/step5.operational-artifacts.test.ts` | Assertions d’ordre des `COPY`, de `--frozen-lockfile` et de conservation du patch. |
| `docs/validation-operationnelle-etape-5-3.md` | Rapport, commandes Fedora, divergence de checkout et qualification des limites. |

## Références de sécurité opérationnelle

Ne pas supprimer `patchedDependencies`, ne pas modifier arbitrairement le patch, ne pas utiliser `--no-frozen-lockfile`, ne pas présenter le démarrage Compose comme une preuve de persistance et ne transmettre aucun secret provenant de `.env.local` ou des journaux.
