# Validation opérationnelle — Étape 5

## Conclusion

La validation opérationnelle réelle a été tentée dans le sandbox courant, mais elle ne peut pas être déclarée réussie : `docker` est absent et les commandes `docker compose config`, `docker compose up -d --build` et `docker compose ps` ont toutes échoué avec `docker: command not found`. Les journaux locaux historiques ont également été audités et les jetons Bearer détectés ont été neutralisés localement ; aucun secret n’est versionné. Les contrôles applicatifs disponibles restent valides. Le statut global est **PARTIAL**, avec les contrôles Docker, PostgreSQL persistant, Prometheus, Node Exporter et la chaîne Alert → Incident qualifiés **BLOCKED — runtime conteneur indisponible dans le sandbox**.

## Environnement et commandes réellement exécutées

L’environnement de validation est le sandbox Ubuntu du projet `/home/ubuntu/it-infrastructure-manager`. Le modèle `.env.local.example` fournit maintenant la convention locale non secrète. Les binaires `docker`, `docker-compose`, `podman` et `nerdctl` sont absents. Les commandes demandées ont été exécutées avec le projet Compose explicite `it-infrastructure-manager` :

```text
docker compose config       -> exit 127, docker: command not found
docker compose -p it-infrastructure-manager up -d --build -> exit 127
docker compose -p it-infrastructure-manager ps             -> exit 127
```

La validation statique a été exécutée avec `pnpm validate`, qui enchaîne le type-check, les tests Vitest et le build de production.

## Matrice de résultats

| Contrôle | Statut | Preuve ou raison |
|---|---|---|
| État Git et branche | PASS | Branche `main`, consolidation précédente synchronisée ; cette mise à jour sera versionnée après validation |
| Schéma Drizzle PostgreSQL | PASS | `pgTable`, `pgEnum`, `pg-core`, identités PostgreSQL |
| Migrations PostgreSQL | PARTIAL | Migration `drizzle-pg/0000_perfect_tyrannus.sql` inspectée et test d’invariants passé ; application sur PostgreSQL réel non exécutée |
| Dépendances et driver | PASS | `pg` et `node-postgres` utilisés ; aucune dépendance MySQL directe |
| Environnement sans secrets | PASS | Placeholders documentés ; aucun `.env` réel versionné |
| Docker Compose config | BLOCKED | `docker: command not found` |
| PostgreSQL healthy | BLOCKED | Runtime conteneur indisponible |
| Backend healthy dans Compose | BLOCKED | Stack non démarrable ici |
| Frontend healthy dans Compose | BLOCKED | Stack non démarrable ici |
| Prometheus healthy | BLOCKED | Stack non démarrable ici |
| Node Exporter healthy | BLOCKED | Stack non démarrable ici |
| Tests PostgreSQL persistants | BLOCKED | Aucune instance PostgreSQL réelle disponible ; les tests actuels d’invariants ne simulent pas une persistance |
| Prometheus scrape `node-exporter:9100` | BLOCKED | Aucune réponse Prometheus réelle obtenue |
| Cible Prometheus `UP` | BLOCKED | Aucun résultat `up` réel obtenu |
| PromQL réelle | BLOCKED | Backend Prometheus non démarré dans Compose |
| Alert Rule → Alert | BLOCKED | Impossible de produire une preuve persistante réelle |
| Alert → Incident → Audit | BLOCKED | Impossible de produire une preuve persistante réelle |
| `GET /` | PASS | Réponse HTTP 200 du serveur applicatif disponible |
| Routes protégées anonymes | PASS | `/api/monitoring/targets`, `/api/monitoring/targets/1/status`, `/api/alerts`, `/api/incidents` et `/api/incidents/1` répondent tous HTTP 401 |
| RBAC et sécurité | PASS par tests de contrat | Les tests tRPC/REST et service restent couverts ; aucune désactivation de sécurité |
| `pnpm validate` | PASS | 16 fichiers de tests, 72 tests passés, TypeScript et build réussis |
| Secrets dans Git/logs | PASS avec assainissement local | Audit des fichiers versionnés : aucun motif secret non qualifié ; les jetons Bearer historiques détectés dans les logs locaux ont été remplacés par `REDACTED` |
| Restart/persistance volume | BLOCKED | Aucun conteneur ni volume PostgreSQL disponible à redémarrer |

## Synchronisation Git

La livraison Étape 5 est commitée sur `main` sous le hash `1618fa8` et poussée vers `https://github.com/ladyclarisse/it-infrastructure-manager`. L’arbre était propre après ce push. Ce commit contient le rapport opérationnel, le modèle `.env.local.example` et le test automatisé des artefacts.

## Preuves non inventées

Aucune cible n’est déclarée `UP`, aucune métrique Node Exporter n’est déclarée observée et aucune alerte ou incident n’est déclaré persisté par cette étape. Les tests unitaires, les tests de contrat et le test d’invariants de migration restent distincts d’un test PostgreSQL réel.

## Procédure à rejouer sur Fedora avec Docker

Depuis un environnement disposant de Docker actif et d’un accès au socket, lancer `docker compose -p it-infrastructure-manager config`, puis `docker compose -p it-infrastructure-manager up -d --build` et attendre les healthchecks. Exécuter ensuite `docker compose -p it-infrastructure-manager ps` et les logs ciblés. Appliquer `drizzle-pg/` sur une base vierge, créer un asset, une monitoring target, une règle, une alerte, un incident et une entrée d’audit, puis vérifier ces données après reconnexion et redémarrage.

Depuis Prometheus, vérifier `/api/v1/status/config`, `/api/v1/targets` et une requête `up{job="node-exporter"}`. Conserver les réponses JSON et les timestamps dans un rapport sans y inclure de mot de passe, token ou URL secrète. La chaîne ne pourra être marquée **PASS** qu’après ces preuves réelles.

## Fichiers de référence

Le diagnostic de conversion est documenté dans `docs/postgresql-migration-audit.md`, la validation de la base dans `docs/validation-postgresql.md`, le dépannage dans `docs/troubleshooting.md` et la configuration Compose dans `docker-compose.yml`. Les migrations historiques MySQL restent conservées sous `drizzle/` et ne doivent pas être exécutées sur PostgreSQL.
