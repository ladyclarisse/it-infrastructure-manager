# Alertes

## Définition et périmètre

Une **métrique** est une valeur observée par Prometheus. Une **alerte** est le résultat d’une condition PromQL et de métadonnées persistées dans IT Infrastructure Manager. Un **incident** est une intervention humaine corrélée à une alerte selon une configuration explicite. Le ticketing, les notifications externes et les actions correctives ne sont pas inclus dans cette étape.

| Élément | Système responsable | État | Donnée conservée |
|---|---|---|---|
| Série temporelle et calcul PromQL | Prometheus | IMPLEMENTED | Hors base applicative |
| Métadonnées de règle | IT Infrastructure Manager | IMPLEMENTED | `alert_rules` |
| État d’une condition observée | IT Infrastructure Manager | IMPLEMENTED | `alerts` |
| Notification externe | Futur connecteur | PLANNED | Aucune |
| Moteur Alertmanager | Futur composant | DESIGNED / PLANNED | Aucun webhook à cette étape |

## Modèle `alert_rules`

Chaque règle contient un nom unique, une description, une expression PromQL, une sévérité (`INFO`, `WARNING`, `CRITICAL`), une durée `forDurationSeconds`, un indicateur `enabled`, ainsi que des labels et annotations JSON. Les timestamps sont générés côté base. Les mutations sont réservées aux rôles de gestion opérationnelle et sont auditées.

Quatre définitions de référence sont disponibles via l’opération de bootstrap idempotente : CPU Node Exporter au-dessus de 90 % pendant cinq minutes, pression mémoire au-dessus de 85 %, pression filesystem au-dessus de 85 %, et cible indisponible avec `up == 0`. Les expressions utilisent les métriques Node Exporter déjà référencées par la configuration Prometheus du projet ; aucune métrique synthétique n’est injectée.

## États observés

Les états applicatifs sont `PENDING`, `FIRING`, `RESOLVED` et `UNKNOWN`. Une réponse Prometheus disponible avec une valeur positive produit `FIRING`; une valeur nulle produit `PENDING` lorsque le moteur renvoie explicitement cette valeur; une absence de série peut résoudre une alerte existante uniquement lorsque l’appel Prometheus a abouti; une erreur réseau, HTTP ou de backend produit `UNKNOWN`. Une indisponibilité ne devient jamais silencieusement « zéro alerte ».

## Déduplication

Le fingerprint est un SHA-256 déterministe du triplet `{ ruleId, monitoringTargetId, labels triés }`. Une observation répétée retrouve la ligne `alerts.fingerprint` unique et met à jour `lastSeenAt` au lieu de créer une nouvelle alerte. Cette contrainte est renforcée par l’index unique SQL. Une nouvelle combinaison de règle, cible ou labels produit un nouvel objet logique.

## Sécurité et RBAC

Toutes les lectures nécessitent une session. La création, la modification, l’activation, la désactivation et la suppression des règles sont protégées par les rôles `admin`, `it_manager` et `systems_network_admin`. Le rôle `user` ne peut ni administrer les règles ni déclencher une synchronisation. Les expressions sont limitées par longueur, séparateurs interdits et contrôle d’équilibrage des délimiteurs ; elles ne transforment pas un utilisateur standard en proxy Prometheus arbitraire.

Les labels et annotations sont des métadonnées non fiables. Ils ne contiennent ni tokens, ni mots de passe, ni clés API. Les expressions sont évaluées uniquement contre `PROMETHEUS_URL`, configuration opérée par l’environnement, et non contre un endpoint fourni dynamiquement par l’utilisateur.

## API

| Méthode | Endpoint | Autorisation |
|---|---|---|
| GET | `/api/alert-rules` | Session + lecture opérationnelle |
| POST | `/api/alert-rules` | Gestion opérationnelle |
| GET | `/api/alert-rules/{id}` | Session + lecture opérationnelle |
| PATCH | `/api/alert-rules/{id}` | Gestion opérationnelle |
| DELETE | `/api/alert-rules/{id}` | Gestion opérationnelle |
| GET | `/api/alerts` | Session + lecture opérationnelle |
| GET | `/api/alerts/{id}` | Session + lecture opérationnelle |

Les mêmes contrats sont disponibles sous `alertRules.*` et `alerts.*` via tRPC. L’évaluation manuelle appelle Prometheus et persiste uniquement l’état de la condition, jamais les séries temporelles.

## Limites

L’évaluation périodique automatique et le webhook Alertmanager restent `DESIGNED / PLANNED`. Le bouton d’évaluation constitue une synchronisation contrôlée et non un polling agressif. La chaîne Prometheus/Node Exporter n’a pas pu être exécutée dans le sandbox lorsque le runtime conteneur est absent ; ce cas reste `BLOCKED` et ne doit pas être remplacé par des métriques fictives.

## Références

[1]: https://prometheus.io/docs/prometheus/latest/querying/basics/ "Prometheus querying basics"
[2]: https://prometheus.io/docs/concepts/metric_types/ "Prometheus metric types"
