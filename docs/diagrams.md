# Diagrammes Étape 2

## Modèle de données

```mermaid
erDiagram
  USERS ||--o{ WORKSTATIONS : primary_user
  LOCATIONS ||--o{ ASSETS : contains
  ASSETS ||--o| SERVERS : specializes
  ASSETS ||--o| WORKSTATIONS : specializes
  ASSETS ||--o| NETWORK_DEVICES : specializes
  ASSETS ||--o{ NETWORK_INTERFACES : exposes
  ASSETS ||--o{ SOFTWARE_INSTALLATIONS : runs
  SOFTWARE ||--o{ SOFTWARE_INSTALLATIONS : installed_as
  ASSETS ||--o{ ASSET_RELATIONSHIPS : source
  ASSETS ||--o{ ASSET_RELATIONSHIPS : destination
  USERS ||--o{ AUDIT_LOGS : acts
```

## Architecture applicative livrée

```mermaid
flowchart TD
  Browser[Browser React] --> Console[Console Infrastructure]
  Console --> TRPC[tRPC /api/trpc]
  TRPC --> Auth[Auth + RBAC middleware]
  Auth --> Service[server/services/inventory.ts]
  Service --> DB[server/db.ts]
  DB --> SQL[(SQL runtime managed)]
  Service --> Audit[Audit logs]
```

## Architecture future, non livrée

```mermaid
flowchart TD
  Devices[Linux / Windows / Cisco] -. future .-> Collectors[Agents / SNMP / Exporters]
  Collectors -. future .-> Monitoring[Monitoring / Collector]
  Monitoring -. future .-> Platform[IT Infrastructure Manager]
```

Le dernier diagramme est une cible d’architecture. Aucun agent, exporter, accès SNMP, scan réseau ou flux de métriques n’est activé dans l’Étape 2.
