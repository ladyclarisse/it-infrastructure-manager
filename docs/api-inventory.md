# API inventaire — Étape 2

Le transport réellement exposé par l’application reste tRPC sous `/api/trpc`, conformément à l’architecture existante. Les noms de procédures sont les contrats livrés. Une façade REST `/api/assets`, `/api/servers`, `/api/workstations`, `/api/network-devices`, `/api/network-interfaces`, `/api/software`, `/api/locations` et `/api/relationships` reste `DESIGNED` et n’est pas présentée comme implémentée.

| Procédure livrée | Entrée principale | Autorisation | État |
|---|---|---|---|
| `infrastructure.overview` | aucune | `operationsProcedure` | IMPLEMENTED |
| `infrastructure.assets.list` | recherche, type, statut, environnement, localisation, page, pageSize | opérations | IMPLEMENTED |
| `infrastructure.assets.get` | `id` | opérations | IMPLEMENTED |
| `infrastructure.assets.create` | attributs administratifs validés | admin, it_manager, systems_network_admin | IMPLEMENTED |
| `infrastructure.assets.update` | `id`, champs partiels validés | admin, it_manager, systems_network_admin | IMPLEMENTED |
| `infrastructure.assets.remove` | `id` | admin, it_manager, systems_network_admin | IMPLEMENTED |
| `infrastructure.servers.list` | filtres communs | opérations | IMPLEMENTED |
| `infrastructure.workstations.list` | filtres communs | opérations | IMPLEMENTED |
| `infrastructure.networkDevices.list/get/create/update/remove` | filtres ou `assetId` | opérations / écriture inventaire | IMPLEMENTED |
| `infrastructure.locations.list/get/create/update/remove` | `id` et champs de lieu | opérations / écriture inventaire | IMPLEMENTED |
| `infrastructure.networkInterfaces.list/get/create/update/remove` | `assetId` ou `id` et champs interface | opérations / écriture inventaire | IMPLEMENTED |
| `infrastructure.software.list/get/create/update/remove` | `id` et champs logiciel | opérations / écriture inventaire | IMPLEMENTED |
| `infrastructure.installations.list/get/create/update/remove` | `assetId`, `softwareId`, `id` et dates | opérations / écriture inventaire | IMPLEMENTED |
| `infrastructure.relationships.list/create/update/remove` | actifs, type et interfaces optionnelles | opérations / écriture inventaire | IMPLEMENTED |

La recherche est réalisée côté SQL sur hostname, nom affiché, asset tag, numéro de série, IP, constructeur et modèle. Les pages sont bornées entre 1 et 100 éléments. Les filtres utilisent les valeurs contrôlées du schéma. Une IP, MAC, hostname, préfixe, VLAN ou ressource parent invalide est refusée par le service métier. Les relations acceptent uniquement `CONNECTED_TO`, `DEPENDS_ON`, `HOSTS` et `RUNS_ON`, et une relation vers soi-même est refusée.

Les erreurs utilisent les codes tRPC cohérents `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND` et `INTERNAL_SERVER_ERROR`. Les mutations sont exécutées par le backend, jamais par une confiance accordée aux contrôles de l’interface. Les actions `ASSET_*`, `NETWORK_INTERFACE_*`, `NETWORK_DEVICE_*`, `SOFTWARE_*`, `SOFTWARE_INSTALLED`, `SOFTWARE_UNINSTALLED`, `LOCATION_*` et `ASSET_RELATIONSHIP_*` sont écrites dans l’audit avec le résultat `success`, sans secret.

Les endpoints CRUD détaillés des interfaces, logiciels, installations, localisations, sous-types réseau et relations sont maintenant exposés par le transport tRPC sous `/api/trpc`. La compatibilité REST `/api/...` reste un contrat futur documenté séparément ; elle n’est pas déclarée livrée. Le contrat est couvert par les tests routeur et service : 36 tests passent actuellement, dont les permissions, filtres, détails, validations et mutations. La persistance PostgreSQL reste explicitement `BLOCKED — PostgreSQL runtime unavailable`. Le monitoring temps réel reste PLANNED. Le dashboard ne présente aucune disponibilité, CPU, RAM ou disque temps réel.
