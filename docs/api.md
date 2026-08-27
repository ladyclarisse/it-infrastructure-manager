# Contrat API

Le runtime actuel expose le contrat applicatif via tRPC sous `/api/trpc`. Une façade REST/OpenAPI est **DESIGNED**, mais n’est pas déclarée livrée tant que ses handlers ne sont pas implémentés.

## Procédures livrées

| Procédure | Accès | Validation | État |
|---|---|---|---|
| `auth.me` | public, retourne l’utilisateur si session valide | session OAuth | IMPLEMENTED |
| `auth.logout` | public | cookie de session | IMPLEMENTED |
| `users.list` | Administrateur, Responsable informatique | recherche ≤ 120 caractères | IMPLEMENTED |
| `users.roles` | Administrateur, Responsable informatique | aucune entrée | IMPLEMENTED |
| `users.updateAccess` | Administrateur, Responsable informatique | id positif, rôle connu, statut connu | IMPLEMENTED |
| `audit.recent` | Administrateur | limite 1–100 | IMPLEMENTED |

Les erreurs anonymes sont renvoyées avec le code `UNAUTHORIZED`; les permissions insuffisantes utilisent `FORBIDDEN`; les entrées invalides utilisent la validation Zod du contrat.

## REST prévu

Les ressources `/api/auth`, `/api/users`, `/api/roles`, `/api/audit`, `/api/servers`, `/api/workstations`, `/api/network-devices`, `/api/monitoring`, `/api/metrics`, `/api/alerts`, `/api/incidents`, `/api/tickets`, `/api/backups` et `/api/documentation` sont **PLANNED** ou **DESIGNED** selon leur module. Elles devront utiliser HTTPS, une authentification de session, des réponses JSON structurées, une pagination explicite et les mêmes contrôles RBAC. Aucun de ces endpoints REST n’est présenté comme `IMPLEMENTED` dans l’Étape 1.
