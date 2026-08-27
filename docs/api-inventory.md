# API inventaire — Étape 2

Le frontend utilise tRPC sous `/api/trpc`, conformément à l’architecture existante. Une façade REST native est également livrée sous `/api/...` pour les ressources d’inventaire. Les deux transports délèguent aux mêmes services métier et aux mêmes contrôles d’identité/RBAC ; aucune règle métier n’est dupliquée dans les handlers REST.

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

Les endpoints CRUD détaillés des assets, sous-types réseau, interfaces, logiciels, installations, localisations et relations sont exposés par tRPC sous `/api/trpc` et par la façade REST native sous `/api/assets`, `/api/network-devices`, `/api/network-interfaces`, `/api/software`, `/api/software-installations`, `/api/locations` et `/api/relationships`. Les lectures nécessitent une session ; les écritures exigent `admin`, `it_manager` ou `systems_network_admin`. Les deux transports utilisent désormais le driver PostgreSQL applicatif ; la connexion réelle, l’application de migration et les requêtes persistantes restent `BLOCKED — runtime PostgreSQL conteneurisé indisponible`. Le monitoring temps réel est livré séparément.
