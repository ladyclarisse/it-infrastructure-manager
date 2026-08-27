# Étape 5.3.3 — Analyse Fedora réelle : SELinux et EAI_AGAIN

## Conclusion

Les preuves Fedora fournies sont cohérentes avec un checkout arrêté au commit `132b7d50d243f1081d391d3384de9c188e9cb537`. Ce commit contient la correction du patch pnpm, mais pas encore la correction SELinux du bind mount Prometheus. Le checkout Manus courant contient cette correction dans le checkpoint `eb5c96070e721fab9a09ea81abe429a4881734e3`, où `docker-compose.yml` utilise `:ro,Z`.

Il ne s’agit donc pas d’une disparition inexpliquée du changement : la Fedora a été synchronisée avec GitHub avant la création ou la publication de la version `eb5c960`. L’action nécessaire est de publier la version courante, puis de synchroniser Fedora sur le nouveau commit. Aucun changement n’est requis concernant `patches/wouter@3.7.1.patch`.

## A. Pourquoi `:Z` manquait

| Référence | État |
|---|---|
| Fedora communiqué | `132b7d50d243f1081d391d3384de9c188e9cb537` |
| Checkout Manus avant cette analyse | `eb5c96070e721fab9a09ea81abe429a4881734e3` |
| `docker-compose.yml` dans Fedora | bind mount terminé par `:ro` |
| `docker-compose.yml` dans le checkout courant | bind mount terminé par `:ro,Z` |
| Patch Wouter | inchangé et présent |

Le commit `132b7d5` était donc une version antérieure au correctif SELinux, tandis que le checkout courant avait déjà reçu ce correctif dans `eb5c960`. La vérification doit porter sur le hash exact après synchronisation, pas seulement sur le nom de branche.

## B. Correction SELinux minimale

Le bind mount est défini ainsi :

```yaml
- ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro,Z
```

`Z` demande un label SELinux privé pour l’usage par le conteneur. La correction conserve le montage en lecture seule, ne désactive pas SELinux et n’élargit pas les permissions du fichier ou du répertoire hôte. Sur Fedora, le contexte doit ensuite être vérifié avec `ls -lZ` et `ls -Zd`.

## C. EAI_AGAIN Corepack/BuildKit

L’erreur `getaddrinfo EAI_AGAIN registry.npmjs.org` apparaît avant `pnpm install`, pendant la récupération de pnpm par Corepack. Les preuves fournies indiquent que la résolution et l’accès HTTPS fonctionnaient depuis Fedora et depuis un conteneur `node:22-alpine` au moment d’autres contrôles. Le symptôme doit donc être traité comme une défaillance intermittente du chemin réseau/DNS de BuildKit ou du registre, et non par une modification applicative.

Il ne faut ni supprimer `--frozen-lockfile`, ni désactiver Corepack, ni déplacer des dépendances, ni ajouter un contournement réseau opaque au projet. La relance recommandée est un nouveau build sans cache après vérification de l’accès réseau, avec conservation des logs de la tentative :

```bash
getent hosts registry.npmjs.org
curl -I --max-time 10 https://registry.npmjs.org/pnpm/-/pnpm-10.4.1.tgz
docker compose --env-file .env.local build --no-cache backend frontend
```

## D. Séquence Fedora après synchronisation

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
grep -n 'prometheus.yml' docker-compose.yml
docker compose --env-file .env.local config
docker compose --env-file .env.local build --no-cache backend frontend
docker compose --env-file .env.local up -d
docker compose --env-file .env.local ps
docker compose --env-file .env.local logs --tail=80 backend frontend postgres prometheus node-exporter
```

Le résultat attendu est un backend qui reste démarré sans `ERR_MODULE_NOT_FOUND` pour Vite et un Prometheus qui lit sa configuration sans `permission denied`. Un build réussi ou un service marqué `Up` ne qualifie pas à lui seul les scénarios applicatifs.

## E. Qualification fonctionnelle encore requise

| Domaine | Scénario requis | Statut actuel |
|---|---|---|
| PostgreSQL applicatif | migrations réellement appliquées, lecture/écriture d’un asset, redémarrage et vérification de persistance | NON VALIDÉ |
| Prometheus applicatif | `/-/healthy`, `/api/v1/targets`, target `node-exporter` en `up` | NON VALIDÉ |
| Alert | PromQL évaluée sur une donnée réelle et résultat enregistré | NON VALIDÉ |
| Incident | corrélation fingerprint, création, transition RBAC et audit | NON VALIDÉ |
| Persistance | redémarrage Compose puis vérification des données PostgreSQL et incidents | NON VALIDÉ |

Les erreurs `thermal_zone` et `powersupplyclass` de Node Exporter doivent être conservées comme avertissements de collectors secondaires tant qu’elles ne rendent pas le conteneur unhealthy.

## Statut

Le correctif SELinux est **VALIDÉ dans le checkout courant et dans le code**, mais doit être confirmé par une nouvelle exécution Fedora après synchronisation sur le commit publié. Le build Fedora précédent sur `132b7d5` et l’échec Corepack `EAI_AGAIN` sont des preuves réelles fournies, tandis que la validation runtime applicative des services et des flux métier reste **NON VALIDÉE**.
