# Étape 5.2 — Rapport de qualification runtime Fedora

## Conclusion

L’Étape 5.2 est préparée et documentée, mais elle ne peut pas être déclarée qualifiée en runtime réel depuis le sandbox courant. Aucune exécution sur l’hôte Fedora de l’utilisateur n’a été observée dans cette session. En conséquence, les domaines Docker, PostgreSQL persistant, Prometheus, Node Exporter, la chaîne Alert → Incident et la persistance après restart restent **BLOCKED — exécution Fedora réelle requise**. Aucun résultat `UP`, aucune alerte persistée et aucun incident persistant ne sont inférés à partir du code, des tests ou de la configuration.

La distinction retenue est la suivante : **PASS** signifie qu’une preuve a été observée ; **FAIL** signifie qu’une preuve observée est incorrecte ; **BLOCKED** signifie que l’environnement nécessaire n’est pas accessible ; **À MESURER** signifie qu’une commande reproductible est prête mais que sa sortie Fedora n’a pas encore été fournie.

## Matrice de qualification

| Domaine | Résultat | Preuve actuellement disponible |
|---|---|---|
| Docker | BLOCKED | Le runtime Docker Fedora n’est pas accessible depuis le sandbox ; aucune preuve Fedora reçue. |
| Docker Compose | BLOCKED | La stack Compose réelle n’a pas été exécutée dans cette session. |
| PostgreSQL | BLOCKED | Aucune instance PostgreSQL Compose réelle observée ; application de `drizzle-pg` à mesurer sur Fedora. |
| Migrations `drizzle-pg` | À MESURER | Les fichiers et invariants sont présents ; l’application sur une base vierge réelle doit être exécutée sur Fedora. |
| Backend | PARTIAL | Le serveur applicatif local répond selon la validation précédente ; son fonctionnement dans Compose Fedora reste à mesurer. |
| Frontend | BLOCKED | Le frontend dans Compose Fedora n’a pas été observé. |
| Prometheus | BLOCKED | Aucun endpoint Prometheus réel de la stack Fedora n’a été interrogé. |
| Node Exporter | BLOCKED | Aucune exposition `/metrics` réelle de la stack Fedora n’a été observée. |
| Target UP | BLOCKED | Aucun résultat réel de `/api/v1/targets` ou `up{job="node-exporter"}` n’a été reçu. |
| PromQL réel | BLOCKED | Aucun serveur Prometheus Fedora n’a été accessible dans cette session. |
| Alert Rule | BLOCKED | La chaîne de règle alimentée par Prometheus n’a pas été exécutée en runtime réel. |
| Alert | BLOCKED | Aucune alerte réellement produite puis persistée depuis Prometheus n’a été observée. |
| Incident | BLOCKED | Aucune corrélation Alert → Incident en base PostgreSQL réelle n’a été observée. |
| Audit | BLOCKED | L’audit de la chaîne runtime doit être vérifié sur la base Fedora après mutation autorisée. |
| Restart | BLOCKED | Aucun restart Compose/PostgreSQL contrôlé dans l’environnement Fedora n’a été observé. |
| Persistance | BLOCKED | Aucune comparaison avant/après restart n’a été fournie. |

## Ce qui est validé par code

La validation automatisée précédente couvre le schéma PostgreSQL Drizzle, les services métier, les routeurs tRPC/REST, le RBAC, la protection SSRF Prometheus, la corrélation et la déduplication au niveau des services, ainsi que les invariants de migration. `pnpm validate` reste la source de vérité pour le contrôle statique, les tests Vitest et le build ; il ne constitue pas une preuve de conteneur, de scraping ou de persistance PostgreSQL réelle.

Le dépôt contient le runbook `docs/runbook-validation-fedora.md`, le protocole de collecte `docs/operations/fedora-runtime-evidence.md` et le script non destructif `scripts/validate-runtime.sh`. Les commandes de ces documents évitent l’affichage des secrets et interdisent toute suppression de volume.

## Ce qui reste à mesurer sur Fedora

L’utilisateur doit exécuter le runbook depuis la racine du dépôt sur l’hôte Fedora disposant de Docker, puis transmettre uniquement les sorties expurgées prévues par `docs/operations/fedora-runtime-evidence.md`. La preuve minimale doit couvrir le démarrage et les healthchecks Compose, l’application des migrations sur une base vierge, les tables attendues, une écriture/relecture métier, la cible Node Exporter `UP`, une requête PromQL réelle, la production et la persistance d’une alerte, la corrélation d’un incident, l’audit, puis la comparaison avant/après restart.

Les commandes exactes et leurs critères d’acceptation sont centralisés dans le protocole de collecte. En particulier, la cible ne sera pas marquée `UP` parce qu’elle figure dans `prometheus.yml` : la réponse réelle de `/api/v1/targets` et la valeur réelle de `up{job="node-exporter"}` sont nécessaires.

## Limitations actuelles

L’architecture actuelle ne doit pas être étendue par Alertmanager, notifications Email/Slack, ticketing, Windows Exporter, SNMP ou nouveaux modules UX avant qualification de la chaîne existante. Si le runtime Fedora montre que Prometheus ne transmet pas automatiquement les alertes au backend, cette limite devra être documentée comme une limite d’intégration et non compensée par une création manuelle présentée comme preuve Prometheus.

Les migrations MySQL historiques sous `drizzle/` sont conservées comme historique ; elles ne doivent pas être exécutées dans le runtime PostgreSQL. La chaîne active est celle de `drizzle-pg/`, avec le driver `pg` et `node-postgres`.

## Corrections effectuées dans cette étape

Le runbook Fedora a été complété par une vérification de l’accès Docker sans sudo et un contrôle explicite du frontend. Le nouveau protocole `docs/operations/fedora-runtime-evidence.md` définit les commandes sûres, les sorties minimales à transmettre, les secrets à exclure, les contrôles avant/après restart et les statuts autorisés. Aucun résultat Fedora n’a été inventé ou reclassé en `PASS`.

## Validation et livraison

Avant livraison, exécuter `pnpm validate`, vérifier `git status`, `git diff --check` et `git diff --stat`, puis pousser le commit sur `main`. Le commit final devra être reporté ici après exécution effective de ces commandes. Le statut global demeure **PARTIAL / BLOCKED runtime Fedora** tant que les preuves de l’utilisateur ne sont pas disponibles.
