# IT Infrastructure Manager

> Console d’administration full-stack pour centraliser les identités aujourd’hui et l’infrastructure demain.

## Project presentation

Le projet répond au besoin de disposer d’un control plane professionnel pour les équipes informatiques : identité, droits, traçabilité et, progressivement, inventaire, monitoring, alertes, tickets et documentation. L’Étape 1 se concentre volontairement sur le socle d’identité réellement connecté au mécanisme **Manus OAuth** fourni par le runtime.

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
| Monitoring réel | PLANNED | Aucun indicateur simulé n’est présenté comme réel |
| Notifications d’alertes | PLANNED | Préparation documentaire uniquement |
| Pièces jointes hors base | PLANNED | Le stockage objet sera associé dans une étape dédiée |

## Démarrage

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

Les variables sont injectées par l’environnement géré. Pour un déploiement autonome, consulter `docs/env.example.md` et renseigner les valeurs hors Git ; aucun secret n’est fourni dans ce dépôt.

## Architecture

Les procédures de `server/routers.ts` exposent les contrats et délèguent les cas d’usage à `server/services/`, qui s’appuie sur `server/db.ts`. Le middleware RBAC de `server/_core/trpc.ts` est exécuté côté serveur ; l’interface ne fait qu’améliorer l’ergonomie. `drizzle/schema.ts` décrit les utilisateurs, rôles, permissions et journaux. Les modules d’infrastructure sont volontairement absents du runtime de cette étape et décrits comme `PLANNED`.

## Pitch entretien

IT Infrastructure Manager est un control plane pensé pour une équipe informatique qui veut passer d’informations dispersées à une administration traçable. J’ai commencé par le risque le plus transversal : l’identité. Le projet s’appuie sur Manus OAuth pour la session, applique un RBAC serveur à cinq rôles, persiste les utilisateurs et journalise les changements sensibles. L’architecture sépare la présentation React, les procédures API, la logique d’accès aux données et le modèle SQL versionné. La prochaine étape consistera à connecter un agent ou un exporter réel, sans mélanger inventaire, métriques et historique.

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
