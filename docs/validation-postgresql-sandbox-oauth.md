# Validation PostgreSQL sandbox et OAuth

## Périmètre

Cette qualification concerne uniquement une instance PostgreSQL 16 locale, installée dans le sandbox de développement. Elle ne constitue ni une connexion à la base PostgreSQL Fedora de l’utilisateur, ni une validation Docker, Prometheus, Node Exporter, Alertmanager ou de la persistance des conteneurs.

## Résultats observés

| Contrôle | Résultat | Preuve observée |
|---|---|---|
| PostgreSQL local | PASS | Cluster PostgreSQL 16 démarré ; rôle et base de test isolés créés. |
| Migration Drizzle initiale | PASS après correction | `roles.slug` est une contrainte `UNIQUE`, référencable par `users.role`. |
| Catalogue de rôles | PASS | Cinq rôles de référence sont initialisés par une migration idempotente. |
| Couche Drizzle | PASS | Un upsert utilisateur de sonde a été écrit, relu puis supprimé. |
| Endpoint `auth.me` | PASS | Un token de session signé a résolu l’utilisateur PostgreSQL attendu. |
| Callback OAuth navigateur | PASS | Une connexion OAuth réelle a atteint le tableau de bord, puis la route protégée `/users`. |
| Persistance OAuth | PASS | Un utilisateur persistant est présent après callback ; aucune sonde temporaire ne subsiste. |

## Correctifs appliqués

La migration initiale déclarait `roles.slug` via un index unique. PostgreSQL n’autorise pas une clé étrangère vers ce type d’index : une contrainte `UNIQUE` est requise. Le schéma, la migration initiale et le snapshot Drizzle ont été alignés sur la contrainte `roles_slug_unique`.

Une migration additionnelle initialise le catalogue de rôles de référence. Cet initialiseur est idempotent grâce à `ON CONFLICT ("slug") DO UPDATE`; il rend possible le premier upsert OAuth dont le rôle par défaut est `user`.

Une seconde base sandbox créée à blanc a ensuite reçu la chaîne complète des migrations. Elle contient les cinq rôles attendus et expose bien `roles_slug_unique` comme contrainte unique ainsi que `users_role_fk` comme clé étrangère, ce qui confirme l’ordre d’application sur une installation neuve.

## Limites maintenues

La prévisualisation gérée reste indépendante de la base PostgreSQL temporaire du sandbox. Les validations suivantes restent à exécuter sur Fedora avec la configuration Docker réelle : PostgreSQL dans Compose, Prometheus, Node Exporter, alertes, incidents et persistance après recréation des conteneurs.
