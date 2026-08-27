# IT Infrastructure Manager

> Console d’administration full-stack pour centraliser les identités aujourd’hui et l’infrastructure demain.

## Project presentation

Le projet répond au besoin de disposer d’un control plane professionnel pour les équipes informatiques : identité, droits, traçabilité et inventaire administratif. L’Étape 2 ajoute le registre d’actifs et ses relations sans activer le monitoring, les agents, le SNMP ou la découverte automatique. L’Étape 2.1 complète les CRUD des interfaces, logiciels, installations, localisations, relations et sous-types réseau via le transport tRPC existant.

Le choix actuel est pragmatique : **React 19 + TypeScript + Tailwind CSS 4** pour une console dense et accessible, **Express + tRPC 11** pour des contrats serveur typés, **Drizzle ORM** pour le modèle versionné, et la base SQL gérée par le runtime. Une cible PostgreSQL/Docker est documentée dans `docs/deployment.md` ; elle sera activée avec une migration dédiée lorsque l’exécution sera déplacée vers un environnement Docker maîtrisé.

## État réel de l’Étape 1

| Capacité | État | Périmètre réel |
|---|---|---|
| Authentification Manus OAuth | TESTED | Session cookie signée, récupération de l’identité et déconnexion du socle |
| Protection des endpoints | IMPLEMENTED | `protectedProcedure` refuse les requêtes anonymes ou les comptes désactivés |
| RBAC serveur | TESTED | Les cinq rôles sont contrôlés côté API, avec anti-escalade et anti-auto-modification |
| Gestion utilisateurs | IMPLEMENTED | Recherche, consultation, modification de rôle et activation/désactivation |
| Journal d’audit | IMPLEMENTED | Contrôles de session, déconnexion et changements d’accès |
| Console React | IMPLEMENTED | Vue d’ensemble, utilisateurs, rôles, audit, responsive |
| Monitoring réel | IMPLEMENTED | Prometheus/Node Exporter, cibles, API et métriques réelles ; runtime inter-services à valider |
| Notifications d’alertes | PLANNED | Aucun canal externe activé ; les incidents sont persistés pour une future étape |
| Pièces jointes hors base | PLANNED | Le stockage objet sera associé dans une étape dédiée |

## État réel de l’Étape 2

| Capacité | État | Périmètre réel |
|---|---|---|
| Modèle commun Asset | IMPLEMENTED | Actifs, types, statut, environnement, localisation et attributs administratifs |
| Inventaire serveurs/postes/réseau | IMPLEMENTED | Listes filtrées par type et tables spécialisées |
| Interfaces, logiciels, installations et relations | IMPLEMENTED | CRUD détaillé, validations, audits, catalogue frontend et façade REST native |
| Sous-types réseau | IMPLEMENTED | `router`, `switch`, `firewall`, `access_point`, `other` |
| Recherche, filtres et pagination | IMPLEMENTED | Recherche SQL et filtres type, statut, environnement et localisation |
| Monitoring Prometheus/Node Exporter | IMPLEMENTED | Cibles, service Prometheus, API monitoring et métriques réelles sans simulation |
| Windows Exporter, SNMP, agents, découverte | PLANNED | Aucun exporter secondaire, scan ou agent propriétaire |
| PostgreSQL/Docker runtime | BLOCKED | Runtime conteneur PostgreSQL non disponible dans l’environnement audité |
| Validation Étape 2.1 | TESTED | `pnpm validate` : 38 tests, TypeScript et build réussis ; façade REST testée par mapping et enregistrement |

## État réel de l’Étape 4

| Capacité | État | Périmètre réel |
|---|---|---|
| Alert Rules PromQL | IMPLEMENTED / TESTED | Métadonnées persistées, quatre règles Node Exporter de référence, validation d’expression et bootstrap idempotent |
| Alertes observées | IMPLEMENTED / TESTED | États `PENDING`, `FIRING`, `RESOLVED`, `UNKNOWN`, fingerprint unique et corrélation contrôlée |
| Incidents | IMPLEMENTED / TESTED | Création, affectation utilisateur, timeline persistée et cycle de vie contrôlé |
| APIs Alerting | IMPLEMENTED / TESTED | tRPC et REST authentifiés avec RBAC serveur |
| Console Alerts/Incidents | IMPLEMENTED | Listes, filtres, détail, timeline, états vides et erreurs explicites |
| Alertmanager | DESIGNED / PLANNED | Aucun webhook ou secret externe activé à cette étape |
| Docker/Prometheus réel | BLOCKED | À exécuter sur un runtime conteneurisé réel |
| PostgreSQL réel | BLOCKED | Validation externe à réaliser si cette cible devient obligatoire |
| Validation Étape 4 | TESTED | Tests service, routeur, REST, présentation frontend, TypeScript et build à confirmer par `pnpm validate` |

## Démarrage

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

Les variables sont injectées par l’environnement géré. Pour un déploiement autonome, consulter `docs/env.example.md` et renseigner les valeurs hors Git ; aucun secret n’est fourni dans ce dépôt.

## Architecture

Les procédures de `server/routers.ts` exposent les contrats et délèguent les cas d’usage à `server/services/`, qui s’appuie sur `server/db.ts`. Le middleware RBAC de `server/_core/trpc.ts` est exécuté côté serveur ; l’interface ne fait qu’améliorer l’ergonomie. `drizzle/schema.ts` décrit l’identité et le modèle commun `assets` avec ses spécialisations, interfaces, logiciels, localisations et relations.

## Pitch entretien

IT Infrastructure Manager est un control plane pensé pour une équipe informatique qui veut passer d’informations dispersées à une administration traçable. J’ai commencé par le risque le plus transversal : l’identité. Le projet s’appuie sur Manus OAuth pour la session, applique un RBAC serveur à cinq rôles, persiste les utilisateurs et journalise les changements sensibles. L’architecture sépare la présentation React, les procédures API, la logique d’accès aux données et le modèle SQL versionné. La prochaine étape recommandée est de valider PostgreSQL réel et les handlers REST sur une base persistante. Un agent ou un exporter réel viendra ensuite, sans mélanger inventaire, métriques et historique.

## Documentation

- [Architecture](docs/architecture.md)
- [Installation](docs/installation.md)
- [Guide utilisateur](docs/user-guide.md)
- [Contrat API](docs/api.md)
- [Déploiement](docs/deployment.md)
- [Sécurité](docs/security.md)
- [RBAC](docs/rbac.md)
- [Audit post-Étape 1](docs/audit-post-etape-1.md)
- [Feuille de route](docs/update.md)
- [Dépannage](docs/troubleshooting.md)
- [Inventaire](docs/inventory.md)
- [Audit post-Étape 2.1](docs/audit-post-etape-2-1.md)
- [Modèle de données](docs/data-model.md)
- [API inventaire](docs/api-inventory.md)
- [Sécurité RBAC](docs/security-rbac.md)
- [Monitoring](docs/monitoring.md)
- [Prometheus](docs/prometheus.md)
- [Node Exporter](docs/node-exporter.md)
- [API monitoring](docs/monitoring-api.md)
- [Dépannage monitoring](docs/monitoring-troubleshooting.md)
- [Alertes](docs/alerts.md)
- [Incidents](docs/incidents.md)
- [Architecture alerting](docs/alerting-architecture.md)
- [Cycle de vie incidents](docs/incident-lifecycle.md)
- [Dépannage alerting](docs/alerting-troubleshooting.md)
- [Audit post-Étape 4](docs/audit-post-etape-4.md)
