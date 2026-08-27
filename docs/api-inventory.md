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
| `infrastructure.networkDevices.list` | filtres communs | opérations | IMPLEMENTED |
| `infrastructure.locations.list` | aucune | opérations | IMPLEMENTED |
| `infrastructure.networkInterfaces.list` | `assetId` optionnel | opérations | IMPLEMENTED |
| `infrastructure.software.list` | aucune | opérations | IMPLEMENTED |
| `infrastructure.relationships.list` | `assetId` optionnel | opérations | IMPLEMENTED |
| `infrastructure.relationships.create` | source, destination, type, interfaces optionnelles | admin, it_manager, systems_network_admin | IMPLEMENTED |

La recherche est réalisée côté SQL sur hostname, nom affiché, asset tag, numéro de série, IP, constructeur et modèle. Les pages sont bornées entre 1 et 100 éléments. Les filtres utilisent les valeurs contrôlées du schéma. Une IP principale invalide, un nombre de ressources négatif, un asset inexistant ou une relation vers soi-même sont refusés par le service métier.

Les erreurs utilisent les codes tRPC cohérents `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND` et `INTERNAL_SERVER_ERROR`. Les mutations sont exécutées par le backend, jamais par une confiance accordée aux contrôles de l’interface. `ASSET_CREATED`, `ASSET_UPDATED`, `ASSET_DELETED` et `ASSET_RELATIONSHIP_CREATED` sont écrits dans l’audit sans secret.

Les mutations spécialisées de création d’interface, logiciel installé, localisation et sous-type détaillé restent à compléter avant de déclarer leurs endpoints dédiés `IMPLEMENTED`. La collection de lecture `infrastructure.networkInterfaces.list` est toutefois livrée. Le dashboard ne présente aucune disponibilité, CPU, RAM ou disque temps réel.
