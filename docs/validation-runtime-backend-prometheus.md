# Validation runtime — Backend production et Prometheus SELinux

## Résumé exécutif

Le build Fedora communiqué après l’Étape 5.3 a réussi pour les images backend et frontend, et PostgreSQL a démarré en état `HEALTHY`. Deux régressions runtime ont ensuite été observées : le backend chargeait `vite` depuis `dist/index.js` alors que le stage runtime n’installe que les dépendances de production, et Prometheus ne pouvait pas lire sa configuration bind-mountée avec SELinux.

Le correctif backend sépare désormais l’entrypoint de développement Vite (`server/_core/index.ts`) de l’entrypoint de production (`server/_core/production.ts`). Le build esbuild cible la production et écrit explicitement `dist/index.js`, qui reste la cible de `start` et du Dockerfile. Le module de production ne référence plus le module Vite : il utilise `server/_core/app.ts` et `server/_core/static.ts`.

Le bind mount Prometheus est passé de `:ro` à `:ro,Z`, afin de demander à Docker un label SELinux privé adapté au conteneur, sans désactiver SELinux, sans `chmod 777` et sans modifier globalement les permissions de l’hôte.

## Diagnostic backend

Le bundle précédent était produit depuis `server/_core/index.ts`. Même si le chemin `setupVite` n’était exécuté qu’en développement, cet entrypoint importait statiquement `./vite`; le module Vite importait lui-même `vite` et `vite.config`. Avec `esbuild --packages=external`, ces imports restaient externes dans le bundle. Le stage runtime exécutait ensuite `pnpm install --prod`, qui excluait correctement `vite` car il se trouvait dans `devDependencies`, d’où `ERR_MODULE_NOT_FOUND`.

La correction ne déplace donc pas Vite dans `dependencies`. Le code partagé de création de l’application HTTP et de démarrage du serveur est dans `server/_core/app.ts`. Le développement utilise `index.ts` et `vite.ts`; la production utilise `production.ts` et `static.ts`. Le script `build` bundle `production.ts` vers `dist/index.js`.

| Vérification | Résultat | Preuve |
|---|---|---|
| Vite reste une dépendance de développement | PASS | Aucun déplacement aveugle vers `dependencies`. |
| Entry production indépendant de Vite | PASS | `production.ts`, `app.ts` et `static.ts` n’importent pas Vite. |
| Cible de démarrage conservée | PASS | `dist/index.js` est généré et `start`/Docker utilisent cette cible. |
| Patch pnpm conservé | PASS | `patchedDependencies`, `patches/` et `--frozen-lockfile` sont conservés. |
| Test avec production dependencies uniquement | PASS local | Un arbre temporaire installé par `pnpm install --prod --frozen-lockfile` a démarré `node dist/index.js` et a écrit `Server running on http://localhost:3199/`; aucune erreur d’import Vite. |

## Diagnostic Prometheus / SELinux

L’erreur Fedora fournie est `open /etc/prometheus/prometheus.yml: permission denied` sur un fichier de configuration monté depuis l’hôte. Ce symptôme est compatible avec un contexte SELinux non autorisant le conteneur à lire le fichier, mais le contexte exact doit être confirmé sur Fedora avec `getenforce`, `ls -lZ` et `ls -Zd`. Le Compose applique maintenant `:ro,Z` au bind mount de configuration. Cette option demande un relabel privé du contenu monté pour l’usage d’un seul conteneur.

Le diagnostic Fedora à joindre au prochain retour est :

```bash
getenforce
ls -lZ monitoring/prometheus/prometheus.yml
ls -Zd monitoring/prometheus
ls -Zd monitoring
ausearch -m avc -ts recent 2>/dev/null | tail -50 || true
docker compose --env-file .env.local config
```

Si `getenforce` retourne `Enforcing`, le prochain démarrage Compose doit vérifier que l’option `:ro,Z` est bien conservée dans la configuration rendue. SELinux ne doit pas être désactivé globalement et les permissions hôte ne doivent pas être élargies au-delà du nécessaire.

## Validation effectuée dans le sandbox

| Contrôle | Résultat |
|---|---|
| TypeScript | PASS |
| Vitest | PASS — 17 fichiers, 78 tests |
| Build Vite + esbuild | PASS — `dist/index.js` généré |
| Références Vite dans `dist/index.js` | PASS — aucune référence externe `vite` détectée |
| Smoke test avec dépendances production-only | PASS — serveur démarré sur le port 3199 pendant le test |
| Docker local | NON DISPONIBLE — aucun binaire Docker dans le sandbox |
| SELinux local | NON DISPONIBLE — diagnostic Fedora requis |

## Preuves Fedora communiquées

Les éléments suivants sont enregistrés comme preuves fournies par l’utilisateur, et non comme observations exécutées dans ce sandbox : les images Docker backend/frontend avaient été construites, PostgreSQL était `HEALTHY`, Node Exporter était `HEALTHY` avec des erreurs thermal/power non qualifiées, le backend échouait au démarrage sur l’import Vite et Prometheus échouait sur la lecture de sa configuration avec `permission denied`.

Après synchronisation du correctif, Fedora doit réexécuter le build et le démarrage. Le build et le démarrage ne suffisent toujours pas à déclarer PASS PostgreSQL applicatif, Prometheus applicatif, Alert, Incident ou persistance. Ces domaines nécessitent leurs scénarios fonctionnels et leurs preuves dédiées du runbook.

```bash
docker compose --env-file .env.local build --no-cache backend frontend
docker compose --env-file .env.local up -d
docker compose --env-file .env.local ps
docker compose --env-file .env.local logs --tail=80 backend frontend postgres prometheus node-exporter
```

Le critère immédiat est l’absence de `ERR_MODULE_NOT_FOUND` pour `vite` côté backend et l’absence de `permission denied` sur `/etc/prometheus/prometheus.yml`. Ensuite seulement, les healthchecks et scénarios applicatifs doivent être vérifiés séparément.

## Fichiers modifiés

| Fichier | Rôle |
|---|---|
| `server/_core/app.ts` | Application HTTP et démarrage communs. |
| `server/_core/index.ts` | Entrypoint développement avec Vite. |
| `server/_core/production.ts` | Entrypoint production sans Vite. |
| `server/_core/static.ts` | Service des fichiers statiques production. |
| `server/_core/vite.ts` | Middleware Vite développement uniquement. |
| `package.json` | Bundle de `production.ts` vers `dist/index.js`. |
| `docker-compose.yml` | Bind mount Prometheus avec `:ro,Z`. |
| `server/step5.operational-artifacts.test.ts` | Régressions entrypoint production et label SELinux. |
| `docs/validation-runtime-backend-prometheus.md` | Rapport de diagnostic et validation. |
