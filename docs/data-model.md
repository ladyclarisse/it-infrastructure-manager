# Modèle de données — Étape 2

Le modèle privilégie une entité `assets` commune afin que les serveurs, postes et équipements réseau partagent une identité stable, un asset tag unique et les mêmes attributs de recherche. Les tables spécialisées portent uniquement les propriétés propres à une famille. Cette structure évite trois CRUD indépendants et prépare l’arrivée d’agents sans imposer leur format de collecte.

| Entité | Rôle | Relations principales |
|---|---|---|
| `assets` | Identité et attributs administratifs communs | `locations`, `network_interfaces`, `asset_relationships` |
| `servers` | Type de serveur et notes spécialisées | 1–1 avec `assets` |
| `workstations` | Utilisateur principal, achat et garantie | 1–1 avec `assets`, 0–1 avec `users` |
| `network_devices` | Type d’équipement et firmware | 1–1 avec `assets` |
| `network_interfaces` | Ports, IP, VLAN, vitesse et états administratifs | N–1 avec `assets` |
| `software` | Catalogue logiciel | N–N via `software_installations` |
| `software_installations` | Version et statut d’installation | N–1 avec `assets` et `software` |
| `locations` | Sites, salles, bureaux, datacenters et racks | 1–N avec `assets` |
| `asset_relationships` | Dépendances ou connexions orientées | N–1 vers source et destination `assets` |
| `audit_logs` | Traçabilité des mutations | acteur utilisateur et cible polymorphe |

Les clés étrangères empêchent les références orphelines. `assetTag` et le couple logiciel/version sont uniques ; le nom d’interface est unique par asset ; une relation identique ne peut pas être enregistrée deux fois. Les index ciblent hostname, série, type, statut, environnement, localisation, interfaces, logiciels et les deux directions des relations.

La migration `drizzle/0003_dizzy_lily_hollister.sql` crée les tables et contraintes sans supprimer de données existantes. Les suppressions sont explicites : sous-types et interfaces suivent l’asset en `CASCADE`, l’utilisateur principal d’un poste devient `NULL`, une destination de relation est protégée en `RESTRICT`, et les interfaces liées à une relation deviennent `NULL`.

La base active du runtime reste pilotée par Drizzle/MySQL. La variante PostgreSQL et son DDL Docker sont une cible documentée, mais ne doivent pas être annoncés comme validés tant que le runtime conteneur n’est pas disponible.
