# Architecture

## Principes

Le projet suit une architecture en couches : React présente les cas d’usage ; les procédures tRPC constituent le contrat d’application ; les middlewares portent l’authentification et le RBAC ; `server/db.ts` centralise les requêtes PostgreSQL via `node-postgres` ; `drizzle/schema.ts` versionne le modèle PostgreSQL et `drizzle-pg/` sa chaîne de migrations. L’identité n’est pas réimplémentée : le runtime fournit Manus OAuth, un cookie de session signé et `sdk.authenticateRequest`.

## Modèle relationnel

| Table | Responsabilité | Suppression |
|---|---|---|
| `users` | identité locale, rôle et statut | désactivation logique |
| `roles` | catalogue extensible des rôles | conservation du catalogue |
| `permissions` | permissions atomiques | conservation du catalogue |
| `role_permissions` | association rôles/permissions | suppression de l’association |
| `audit_logs` | traçabilité des actions sensibles | conservation, purge gouvernée ultérieurement |

Les identifiants sont auto-incrémentés, les comptes sont indexés par `email`, `role` et `status`, et les événements par `actorUserId` et `action`. L’Étape 2 ajoute `assets`, `servers`, `workstations`, `network_devices`, `network_interfaces`, `software`, `software_installations`, `locations` et `asset_relationships`, avec index, uniques et clés étrangères documentés dans `docs/data-model.md`. Le monitoring réel, les alertes et les incidents sont livrés dans des modules séparés : Prometheus reste le moteur des séries temporelles et l’application conserve les métadonnées, épisodes, incidents et audits. Le ticketing, les sauvegardes et les documents restent `PLANNED`.

## RBAC

Les rôles exacts sont `Administrateur`, `Administrateur systèmes/réseaux`, `Technicien`, `Responsable informatique` et `Utilisateur`. La politique d’inventaire est vérifiée côté API par `operationsProcedure` pour la lecture et par une procédure réservée aux rôles d’administration pour les mutations. L’interface peut masquer une entrée pour l’ergonomie, mais elle ne constitue jamais le contrôle de sécurité.

## Flux d’identité

Manus OAuth authentifie l’utilisateur, le SDK vérifie la session, synchronise l’identité dans `users`, puis les procédures appliquent `protectedProcedure`, `identityAdminProcedure` ou `adminProcedure`. Les contrôles de session et les changements d’accès produisent un événement d’audit.
