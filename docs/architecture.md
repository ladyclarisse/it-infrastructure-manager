# Architecture

## Principes

Le projet suit une architecture en couches : React présente les cas d’usage ; les procédures tRPC constituent le contrat d’application ; les middlewares portent l’authentification et le RBAC ; `server/db.ts` centralise les requêtes ; `drizzle/schema.ts` versionne le modèle. L’identité n’est pas réimplémentée : le runtime fournit Manus OAuth, un cookie de session signé et `sdk.authenticateRequest`.

## Modèle relationnel

| Table | Responsabilité | Suppression |
|---|---|---|
| `users` | identité locale, rôle et statut | désactivation logique |
| `roles` | catalogue extensible des rôles | conservation du catalogue |
| `permissions` | permissions atomiques | conservation du catalogue |
| `role_permissions` | association rôles/permissions | suppression de l’association |
| `audit_logs` | traçabilité des actions sensibles | conservation, purge gouvernée ultérieurement |

Les identifiants sont auto-incrémentés, les comptes sont indexés par `email`, `role` et `status`, et les événements par `actorUserId` et `action`. Les relations d’infrastructure futures — `servers`, `workstations`, `network_devices`, `metrics`, `alerts`, `incidents`, `tickets`, `backups` et `documentation` — ne sont pas déclarées implémentées à cette étape.

## RBAC

Les rôles exacts sont `Administrateur`, `Administrateur systèmes/réseaux`, `Technicien`, `Responsable informatique` et `Utilisateur`. La politique est vérifiée côté API. L’interface peut masquer une entrée pour l’ergonomie, mais elle ne constitue jamais le contrôle de sécurité.

## Flux d’identité

Manus OAuth authentifie l’utilisateur, le SDK vérifie la session, synchronise l’identité dans `users`, puis les procédures appliquent `protectedProcedure`, `identityAdminProcedure` ou `adminProcedure`. Les contrôles de session et les changements d’accès produisent un événement d’audit.
