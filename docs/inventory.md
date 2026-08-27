# Inventaire infrastructure — Étape 2

## Périmètre

L’Étape 2 introduit un registre d’actifs administratifs réellement persisté. Le modèle commun `assets` représente les serveurs, postes de travail et équipements réseau sans dupliquer les attributs d’identité, réseau, système, environnement, localisation et statut. Les tables spécialisées `servers`, `workstations` et `network_devices` permettent d’ajouter les attributs propres à chaque famille ; les interfaces, logiciels, installations et relations sont des entités liées par clés étrangères.

Les valeurs d’inventaire proviennent de l’API tRPC et de la base active. Aucun actif de démonstration n’est injecté silencieusement. Une future seed de laboratoire devra utiliser explicitement l’environnement `LAB` et être séparée des données de production.

## Capacités

| Capacité | État | Preuve ou limite |
|---|---|---|
| Modèle commun Asset | IMPLEMENTED | Table `assets`, type, identité, réseau, système, ressources administratives et localisation |
| Serveurs, postes et réseau | IMPLEMENTED | Types d’actifs, listes filtrées et tables spécialisées |
| Interfaces réseau | DESIGNED | Table relationnelle créée et affichée dans le détail ; mutation dédiée future |
| Logiciels et installations | DESIGNED | Tables relationnelles créées ; écrans de gestion détaillée futurs |
| Localisations | IMPLEMENTED | Table et lecture API |
| Relations entre actifs | IMPLEMENTED | Table, lecture, création contrôlée et affichage du détail |
| Recherche et filtres | IMPLEMENTED | Recherche serveur sur hostname, IP, tag, série, constructeur et modèle ; filtres type/statut/environnement/localisation |
| Validation automatisée | TESTED | 24 tests Vitest passés, dont 4 tests service inventaire, 4 tests routeur, et `pnpm check` réussi |
| Pagination | IMPLEMENTED | Page et pageSize bornés dans l’API |
| Monitoring réel | PLANNED | Aucune CPU/RAM/disponibilité temps réel n’est calculée ou affichée |
| Agents, SNMP, découverte | PLANNED | Aucun accès réseau sortant ni collecte automatique |

## Statuts et données administratives

`ACTIVE`, `INACTIVE`, `MAINTENANCE`, `RETIRED` et `UNKNOWN` décrivent le statut administratif. Ils ne constituent pas une preuve de disponibilité. Les champs CPU, mémoire et stockage sont des valeurs déclaratives, pas des métriques. L’environnement distingue `PRODUCTION`, `DEVELOPMENT`, `TEST`, `LAB` et `OTHER`.

La suppression d’un asset applique les règles relationnelles documentées : les enfants propres à l’asset sont supprimés en cascade, la destination d’une relation est protégée par `RESTRICT`, les interfaces référencées deviennent nulles et les installations suivent leur asset. La mutation DELETE est réservée aux rôles d’administration d’inventaire et chaque changement est audité.
