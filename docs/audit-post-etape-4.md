# Audit post-Étape 4 — Alertes et Incidents

## Conclusion

**ÉTAPE 4 VALIDÉE AVEC RÉSERVES.** La couche applicative Alert Rules → Alerts → Incidents est implémentée, authentifiée, contrôlée par RBAC, auditée et couverte par des tests backend, API et de présentation frontend. La chaîne inter-services Docker/Prometheus et la persistance PostgreSQL sur un runtime externe restent à confirmer dans un environnement disposant des services réels.

## Architecture

Prometheus reste responsable de l’évaluation PromQL et des séries temporelles. L’application stocke les métadonnées de règles, les épisodes d’alertes, les incidents et leur timeline. La séparation Metric / Alert / Incident / Ticket est respectée. **IMPLEMENTED.** Alertmanager est conçu comme une extension future, mais n’est pas activé. **DESIGNED / PLANNED.**

## Alert Rules

La table `alert_rules` contient le nom unique, la description, l’expression, la sévérité, la durée, l’activation, les labels, les annotations et les timestamps. Quatre règles Node Exporter sont disponibles par bootstrap idempotent : CPU, mémoire, filesystem et `up == 0`. La validation des expressions, la mutation et l’audit sont implémentés. **IMPLEMENTED.**

## Alerts

La table `alerts` conserve `ruleId`, `monitoringTargetId`, fingerprint, sévérité, état, résumé, description, timestamps, labels et annotations. Les états sont `PENDING`, `FIRING`, `RESOLVED` et `UNKNOWN`. Les erreurs Prometheus produisent `UNKNOWN`; elles ne sont pas converties en résolution ou en zéro. La contrainte unique du fingerprint et le calcul SHA-256 trié assurent la déduplication. **IMPLEMENTED.**

## Incidents

La table `incidents` conserve le contexte d’intervention, la source, la cible, l’alerte d’origine, l’utilisateur affecté, le statut et les notes de résolution. `incident_history` conserve les événements de timeline avec acteur et transitions. **IMPLEMENTED.** Le ticketing complet est **PLANNED**.

## Prometheus

L’évaluation manuelle appelle le client Prometheus existant et ne duplique pas le moteur de calcul en SQL. Les expressions initiales reprennent les métriques Node Exporter déjà utilisées par l’Étape 3. Les requêtes réelles en environnement conteneurisé sont **DESIGNED / TESTED par contrat**, mais la preuve `FIRING` avec Prometheus réel est **BLOCKED** dans le sandbox sans runtime conteneur.

## Alertmanager

L’ajout d’Alertmanager immédiat n’est pas justifié : l’application possède déjà le stockage, la déduplication et la corrélation nécessaires à cette étape. Un webhook sécurisé, authentifié et idempotent pour événements `firing`/`resolved` est **DESIGNED / PLANNED**. Aucun secret de webhook n’est requis ni stocké aujourd’hui.

## RBAC

Les lectures sont réservées aux sessions et au périmètre `operationsProcedure`. Les mutations de règles, synchronisations et incidents utilisent `inventoryManagerProcedure`, soit `admin`, `it_manager` et `systems_network_admin`. Le rôle `technician` peut lire mais ne peut pas administrer ces objets selon la hiérarchie existante. Le rôle `user` et les requêtes anonymes sont refusés. **IMPLEMENTED / TESTED.**

## Audit

Les créations, modifications, activations, désactivations et suppressions de règles sont auditées. Les créations, corrélations, affectations et transitions d’incidents écrivent l’audit général ainsi que la timeline métier. Les labels et métadonnées ne contiennent aucun secret. **IMPLEMENTED / TESTED.**

## Tests

| Domaine | Résultat |
|---|---|
| Service Alerting | 8 tests passés |
| Routeur tRPC Alerting | 4 tests passés |
| Façade REST Alerting | 1 test passé |
| Présentation frontend | 3 tests passés |
| Monitoring Étape 3 | 7 tests passés dans la validation ciblée |
| Suite projet complète | 66 tests passés ; TypeScript et build production réussis via `pnpm validate` |
| Prometheus/Node Exporter réel | BLOCKED sans runtime conteneur |
| PostgreSQL réel / FK / persistance externe | BLOCKED selon disponibilité runtime |

## Docker

La configuration Docker/Compose de l’Étape 3 reste la référence pour Prometheus et Node Exporter. Le contrôle local confirme `docker: command not found`; l’exécution inter-services n’a pas été simulée et doit être réalisée sur une machine disposant de Docker ou Podman. **BLOCKED dans le sandbox.**

## PostgreSQL

Le runtime géré courant utilise le dialecte MySQL/TiDB de la base du projet ; la migration générée et appliquée dans cet environnement crée les quatre tables et leurs FK/index. Une validation PostgreSQL réelle est **BLOCKED** tant qu’une instance PostgreSQL dédiée n’est pas disponible. Le schéma reste portable conceptuellement, mais la compatibilité PostgreSQL doit être vérifiée séparément avant un changement de dialecte.

## Sécurité

Les payloads sont validés par Zod côté tRPC et par le service métier côté serveur. Les identifiants sont bornés, les cibles sont vérifiées, les utilisateurs désactivés ne peuvent pas être affectés, et l’endpoint Prometheus n’est jamais pris dans le payload. La surface de proxy PromQL est réservée aux rôles gestionnaires et les expressions ont des limites de longueur et de syntaxe. **IMPLEMENTED / TESTED.**

## Dette technique

L’évaluation automatique périodique, l’ingestion Alertmanager, les notifications externes, le ticketing, les vues enrichies par nom d’actif/utilisateur et une transaction atomique englobant mutation, timeline et audit restent à traiter. L’interface actuelle propose une synchronisation manuelle contrôlée et n’essaie pas de masquer ces absences.

## Limites

La liste d’incidents expose les filtres de statut, sévérité, utilisateur assigné, cible et date ; elle affiche encore les identifiants techniques utilisateur/cible tant que des jointures de présentation dédiées ne sont pas ajoutées. Les règles initiales sont chargées par action explicite plutôt que par seed silencieux. La validation `PENDING` dépend de la forme de réponse Prometheus et sera affinée lors de l’intégration Alertmanager ou d’un évaluateur périodique.

## Fichiers principaux

| Catégorie | Fichiers |
|---|---|
| Schéma et migration | `drizzle/schema.ts`, `drizzle/0005_cooing_wolfsbane.sql` |
| Persistence et métier | `server/db.ts`, `server/services/alerting.ts` |
| APIs | `server/routers.ts`, `server/rest/alerting.ts`, `server/_core/index.ts` |
| Frontend | `client/src/pages/Alerts.tsx`, `client/src/pages/Incidents.tsx`, `client/src/components/DashboardLayout.tsx` |
| Tests | `server/alerting.service.test.ts`, `server/alerting.router.test.ts`, `server/alerting.rest.test.ts`, `client/src/pages/alertingPresentation.test.ts` |
| Documentation | `docs/alerts.md`, `docs/incidents.md`, `docs/alerting-architecture.md`, `docs/incident-lifecycle.md`, `docs/alerting-troubleshooting.md` |

## Traçabilité Git

Le commit fonctionnel Étape 4 `569674a` a été poussé sur la branche `main`, puis le commit documentaire de traçabilité `e3e6d84` a été synchronisé sur `main` dans le dépôt `ladyclarisse/it-infrastructure-manager`. Aucun secret n’est inclus dans cette contribution.

## Recommandation Étape 5

Prioriser une intégration Alertmanager webhook authentifiée ou un worker périodique raisonnable, puis ajouter les notifications et le ticketing comme consommateurs des incidents persistés. Avant cela, exécuter la validation complète sur un runtime Docker/Prometheus réel et confirmer la compatibilité de migration sur PostgreSQL si cette cible devient obligatoire.
