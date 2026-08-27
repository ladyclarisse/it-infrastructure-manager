# Audit post-Étape 1 — IT Infrastructure Manager

**Périmètre.** Cet audit est une inspection objective de l’état présent du dépôt. Aucune nouvelle fonctionnalité ni modification d’architecture n’a été engagée pendant l’audit. Les observations distinguent systématiquement le code réellement utilisé, la cible Docker préparée et les éléments seulement prévus.

## A. Verdict général

# ÉTAPE 1 VALIDÉE AVEC RÉSERVES

Le socle d’identité est exécutable dans le runtime géré : le frontend, le backend, l’authentification Manus OAuth, la protection serveur RBAC, la consultation des utilisateurs, les migrations SQL actives et les tests unitaires passent les vérifications disponibles. La réserve principale concerne la divergence entre la base réellement utilisée par l’application et la cible PostgreSQL Docker, ainsi que l’absence de tests d’intégration persistants des mutations utilisateurs. La vulnérabilité de promotion potentielle du Responsable informatique vers Administrateur a été corrigée côté backend et couverte par des tests de non-escalade. Docker n’a pas pu être lancé dans l’environnement d’audit.

## B. Inventaire du dépôt

Le dépôt contient 154 fichiers hors `node_modules`, `dist` et `.git`. Les zones importantes sont `client/` pour React, `server/` pour Express/tRPC et l’identité, `drizzle/` pour le schéma et les migrations, `docker/` et `docker-compose.yml` pour la cible conteneurisée, `infrastructure/postgres/` pour le DDL PostgreSQL cible, `docs/` pour la documentation, et `server/*.test.ts` pour les tests. Les sorties compilées présentes sous `dist/` sont des artefacts générés et sont ignorées par Git.

| Élément | Fichiers principaux | Rôle réellement observé |
|---|---|---|
| Frontend | `client/src/App.tsx`, `client/src/components/DashboardLayout.tsx`, `client/src/pages/*.tsx` | Console React avec navigation, état de session, utilisateurs, rôles, audit et écrans `PLANNED` |
| Backend | `server/_core/index.ts`, `server/routers.ts`, `server/services/` | Serveur Express, API tRPC montée sous `/api/trpc`, services d’identité et d’accès |
| Données | `drizzle/schema.ts`, `server/db.ts` | Drizzle avec pilote `mysql2`, tables utilisateurs/RBAC/audit |
| Auth | `server/_core/oauth.ts`, `server/_core/sdk.ts`, `server/_core/context.ts` | Manus OAuth, cookie de session JWT signé, synchronisation de l’utilisateur local |
| Autorisation | `server/_core/trpc.ts` | `protectedProcedure`, `roleProcedure`, `adminProcedure`, `identityAdminProcedure` |
| Docker | `docker/backend.Dockerfile`, `docker/frontend.Dockerfile`, `docker-compose.yml` | Préparation statique d’une cible backend/frontend et PostgreSQL |
| Documentation | `README.md`, `docs/*.md` | Architecture, installation, API prévue, sécurité, déploiement et feuille de route |

## C. Matrice d’état

Les états utilisés sont exclusivement `PLANNED`, `DESIGNED`, `IMPLEMENTED`, `TESTED` et `BLOCKED`.

| Composant | État | Preuve concrète |
|---|---|---|
| Frontend | TESTED | `pnpm build` réussit ; les routes `/`, `/users`, `/roles` et `/audit` ont été capturées dans le navigateur ; la navigation est rendue avec une session réelle dans le runtime géré. |
| Backend | TESTED | `pnpm check` réussit ; le build esbuild réussit ; `/` répond HTTP 200 et l’API tRPC est montée par `server/_core/index.ts`. |
| PostgreSQL | BLOCKED | Le projet contient un DDL PostgreSQL cible, mais `DATABASE_URL` actif est MySQL et `drizzle.config.ts` utilise le dialecte MySQL ; aucune partie du runtime géré n’utilise PostgreSQL. |
| Docker Compose | BLOCKED | La configuration est présente statiquement, mais aucun runtime `docker`, `podman` ou `nerdctl` n’est disponible pour la lancer ; aucune affirmation de fonctionnement runtime n’est faite. |
| Authentification | TESTED | Le serveur a retrouvé une session utilisateur dans le navigateur ; `auth.me` sans session répond HTTP 200 avec `null`, et le logout possède un test dédié. |
| Utilisateurs | IMPLEMENTED | `users.list`, la recherche, la modification de rôle et l’activation/désactivation sont codées et l’écran affiche les données de la base active ; les mutations réussies persistantes ne sont pas couvertes par un test d’intégration. |
| Rôles | IMPLEMENTED | Les cinq rôles sont présents dans `ROLE_SLUGS`, le catalogue persistant est seedé en base et l’interface les expose. Les permissions atomiques ne sont pas seedées ni utilisées par les procédures actuelles. |
| RBAC | TESTED | Les tests couvrent refus anonyme, accès du Responsable informatique, refus de l’Utilisateur, accès audit de l’Administrateur, anti-auto-modification, anti-escalade Responsable informatique → Administrateur, refus Technicien/Utilisateur, compte désactivé et rejet d’un rôle inconnu. |
| Audit logs | IMPLEMENTED | La table et ses index existent ; des lignes `AUTH_SESSION_CHECK` ont été observées en base ; le code prévoit `AUTH_LOGIN_SUCCESS`, `AUTH_LOGOUT` et `USER_ACCESS_UPDATED`. L’écriture de chaque mutation n’est pas testée par une intégration dédiée. |
| OAuth | TESTED | Le callback OAuth valide `code` et `state`, vérifie le nonce, crée une session et redirige ; le runtime a fourni un utilisateur authentifié. |
| Migrations | TESTED | Trois migrations générées sont versionnées ; les migrations RBAC et contraintes ont été appliquées à la base active ; les FK et règles `CASCADE`, `SET NULL` et `RESTRICT` ont été vérifiées en lecture seule. |
| Tests | TESTED | Quatre fichiers de test, seize cas exécutés avec succès sur les tests ciblés ; les tests ajoutés couvrent désormais réactivation, anti-escalade et audit au niveau service, mais restent des tests avec doubles de données, non des intégrations PostgreSQL multi-services. |
| Documentation API | DESIGNED | `docs/api.md` documente les procédures livrées et les ressources REST/OpenAPI prévues, en laissant les endpoints REST non implémentés hors de l’état `IMPLEMENTED`. |
| README | IMPLEMENTED | Le README présente l’objectif, l’état réel, l’architecture, le pitch et les liens documentaires ; il indique la distinction runtime géré/target PostgreSQL. |

## D. Authentification et sessions

La création de compte locale n’existe pas. Le login réel est un échange Manus OAuth dans `server/_core/oauth.ts`, avec validation d’un `code`, d’un `state` et d’un cookie nonce `__Host-oauth_state`. Le SDK vérifie ensuite un JWT de session signé par `JWT_SECRET`, accepte le cookie de session et un fallback Bearer utilisé par le runtime de preview, puis synchronise l’utilisateur dans `users`.

Le logout est implémenté par suppression du cookie et possède un test. `auth.me` retourne l’utilisateur courant. Les sessions expirent via l’expiration du JWT définie par le SDK. Aucun mot de passe applicatif n’est stocké ou hashé : cette responsabilité est déléguée à Manus OAuth. Les comptes `disabled` sont refusés par le middleware `requireUser`.

La protection backend est réelle pour les procédures tRPC : `users.list`, `users.roles` et `users.updateAccess` exigent Administrateur ou Responsable informatique ; `audit.recent` exige Administrateur. En revanche, la façade REST/OpenAPI annoncée dans la documentation n’est pas implémentée.

## E. RBAC et risques d’escalade

Les rôles effectivement reconnus par l’API sont `admin`, `systems_network_admin`, `technician`, `it_manager` et `user`, affichés avec les libellés exacts demandés. Le contrôle actuel est une allowlist de rôles dans le middleware, non une résolution de permissions à partir de `role_permissions`. La table `permissions` et la table d’association existent et sont contraintes, mais elles ne contiennent pas encore un catalogue de permissions opérationnel consommé par les procédures.

L’auto-modification est refusée dans `server/services/identity.ts`. La hiérarchie backend interdit au Responsable informatique d’attribuer `admin`, interdit à Technicien et Utilisateur d’appeler la mutation, et refuse la modification d’une cible de niveau supérieur. La modification du propre rôle ou statut est bloquée pour tous les acteurs. La promotion vers `admin` est réservée à l’Administrateur.

## F. Journalisation

Les événements actuellement prévus ou écrits sont `AUTH_LOGIN_SUCCESS` lors de l’authentification SDK, `AUTH_SESSION_CHECK` dans `auth.me`, `AUTH_LOGOUT` dans `auth.logout` et `USER_ACCESS_UPDATED` lors d’une modification d’accès. Les journaux stockent l’acteur, l’action, la cible, des métadonnées JSON sérialisées, l’IP, le user-agent et la date. La FK vers `users` utilise `ON DELETE SET NULL`.

Les actions de création d’utilisateur locale, de modification de profil et d’administration d’infrastructure n’existent pas à cette étape. `audit.recent` est protégé par le rôle Administrateur. Aucune procédure de suppression ou de modification des journaux n’est exposée au frontend, mais la garantie complète d’immutabilité n’est pas encore formalisée au niveau base de données.

## G. Base de données et PostgreSQL

Le schéma réellement utilisé par l’application est `drizzle/schema.ts`, basé sur `drizzle-orm/mysql2`, avec un dialecte `mysql` dans `drizzle.config.ts`. La base active gérée contient réellement les tables `users`, `roles`, `permissions`, `role_permissions` et `audit_logs`. Les contraintes observées sont `users_role_fk` avec `RESTRICT`, les deux FK de `role_permissions` avec `CASCADE`, et `audit_logs_actor_fk` avec `SET NULL`.

PostgreSQL n’est donc pas le moteur réellement utilisé par le runtime audité. Le fichier `infrastructure/postgres/001_identity_rbac.sql` est une cible autonome correctement structurée avec `BIGSERIAL`, `TIMESTAMPTZ`, `JSONB`, FK et règles `ON DELETE`, mais il n’est ni exécuté par l’application actuelle ni utilisé par les tests. La présence de `pg` dans les dépendances ne suffit pas à établir un usage PostgreSQL.

## H. Docker

Les Dockerfiles backend et frontend sont présents. Compose déclare PostgreSQL 16, un volume `postgres_data`, un réseau `it-internal`, des dépendances et un healthcheck PostgreSQL. Le backend expose le port 3000 et le frontend utilise Nginx.

Le runtime Docker n’est pas disponible dans le sandbox : **BLOCKED — runtime Docker indisponible**. La communication entre services, le démarrage réel, le healthcheck backend, le build des images et la persistance du volume n’ont donc pas pu être validés. En outre, `docker-compose.yml` déclare actuellement `postgres` et `backend`, mais pas le service `frontend`, malgré la présence de son Dockerfile.

## I. Tests exécutés

| Test | Fichier | Résultat | Couverture réelle |
|---|---|---|---|
| `auth.logout` — efface le cookie | `server/auth.logout.test.ts` | TESTED | Vérifie le nom du cookie, `maxAge`, `secure`, `sameSite`, `httpOnly` et `path`. |
| RBAC — refus anonyme | `server/rbac.test.ts` | TESTED | `users.list` retourne `UNAUTHORIZED` sans utilisateur. |
| RBAC — Responsable informatique autorisé | `server/rbac.test.ts` | TESTED | Le rôle `it_manager` franchit la garde de liste. |
| RBAC — Utilisateur refusé | `server/rbac.test.ts` | TESTED | Le rôle `user` retourne `FORBIDDEN`. |
| RBAC — audit Administrateur | `server/rbac.test.ts` | TESTED | Le rôle `admin` peut appeler `audit.recent`. |
| RBAC — auto-désactivation refusée | `server/rbac.test.ts` | TESTED | Le service bloque la désactivation de son propre compte. |
| RBAC — rôle inconnu refusé | `server/rbac.test.ts` | TESTED | Zod rejette la valeur hors catalogue. |
| Schéma — tables exportées | `server/schema.test.ts` | TESTED | Vérifie seulement l’existence des cinq exports, pas la persistance ni toutes les contraintes. |

Commandes passées : `pnpm check`, `pnpm test`, `pnpm build`, `pnpm validate`, appels HTTP à `/`, `/api/trpc/auth.me` et `/api/trpc/users.list`, ainsi que des requêtes SQL de lecture sur les tables et contraintes. Les résultats sont respectivement TypeScript sans erreur, seize tests réussis, build réussi, API root HTTP 200, `auth.me` sans session HTTP 200 avec `null`, et `users.list` sans session HTTP 401.

## J. Tests manquants avant l’Étape 2

Les tests de service couvrent désormais le changement de rôle, la réactivation et la ligne d’audit associée ; il reste à tester ces mêmes mutations avec persistance réelle, ainsi que la désactivation persistante. Il faut également tester l’accès d’un compte désactivé, la tentative de promotion par un Responsable informatique, la séparation exacte des permissions atomiques, la persistance sur un vrai PostgreSQL, les migrations dans un environnement vierge, le démarrage Compose et les interactions frontend → API → base.

La couverture HTTP doit être étendue à `users.list` authentifié, `users.updateAccess` authentifié et aux réponses d’erreur de validation. Les tests actuels avec `appRouter.createCaller` ne constituent pas des tests d’intégration de la couche HTTP ni des interactions entre services.

## K. Sécurité

Les points positifs sont l’absence de mot de passe local, la session JWT signée, les cookies `httpOnly` et `secure` en HTTPS, la validation Zod, la protection serveur des procédures, les FK, l’indexation, la séparation des secrets par environnement et l’exclusion Git des fichiers `.env` et artefacts.

Les points à renforcer sont l’absence de middleware CORS explicitement configuré dans le bootstrap, l’absence de limitation de débit visible, la durée de session longue définie par le SDK, l’absence de politique d’immutabilité native des audit logs et la possibilité actuelle pour un Responsable informatique de choisir le rôle Administrateur sur une autre identité. Aucun test destructif n’a été réalisé.

## L. Documentation et cohérence

La documentation est globalement honnête sur les modules futurs : monitoring, sauvegardes, REST/OpenAPI et notifications sont décrits comme `PLANNED` ou `DESIGNED`. Le README explique que le runtime géré utilise sa base SQL intégrée et que PostgreSQL est une cible autonome.

La principale incohérence documentaire/technique est que la cible Docker paraît être une pile PostgreSQL, alors que l’application active et Drizzle utilisent MySQL. La documentation de déploiement doit conserver cette réserve jusqu’à l’alignement effectif du driver, du dialecte et des migrations. Le fichier `template.json` conserve par ailleurs le template initial ; il s’agit d’un fichier généré/configuration, non d’un chemin d’exécution métier actuel.

## M. GitHub et intégrité du dépôt

La branche active est `main`. Le dernier commit local et distant est `b0b8d0b` (`test: record runtime API validation`), et le remote `github` pointe vers `ladyclarisse/it-infrastructure-manager`. Le dépôt GitHub n’est plus vide et la branche `main` est synchronisée. Aucun fichier nommé `.env`, `.env.*`, secret ou credential n’a été trouvé dans le périmètre suivi. L’historique n’a pas été réécrit.

## N. Problèmes classés par gravité

| Gravité | Problème | Impact |
|---|---|---|
| Critique | Aucun problème critique démontré dans le périmètre audité. | — |
| Important | Le runtime applicatif utilise MySQL alors que la cible Docker annonce PostgreSQL. | Déploiement autonome non interchangeable ; migrations et driver doivent être alignés avant usage PostgreSQL réel. |
| Important | Le risque initial de promotion par un Responsable informatique a été corrigé ; la matrice de permissions dynamique n’est toutefois pas encore utilisée. | La promotion `admin` est désormais réservée à l’Administrateur ; la résolution dynamique des permissions reste à venir. |
| Important | Les mutations utilisateurs réussies et leur audit ne sont pas testés avec persistance réelle. | Le statut `IMPLEMENTED` est justifié par le code, mais pas `TESTED` pour ces flux. |
| Important | Docker et la communication inter-services ne sont pas exécutables dans l’environnement actuel. | Healthchecks, démarrage et volumes restent `BLOCKED`. |
| Mineur | Le service frontend n’est pas déclaré dans `docker-compose.yml`. | La cible Docker est incomplète par rapport aux Dockerfiles présents. |
| Mineur | Les permissions atomiques sont modélisées mais non peuplées ni résolues par les procédures. | Le RBAC actuel fonctionne par allowlist de rôles, sans matrice dynamique. |
| Mineur | CORS et rate limiting ne sont pas explicitement configurés dans le bootstrap. | Durcissement recommandé avant exposition publique. |

## O. Dette technique et recommandation

La dette principale est l’alignement de la cible PostgreSQL, le renforcement du RBAC contre la promotion non autorisée, l’ajout de tests d’intégration persistants et la validation Docker dans un environnement disposant d’un runtime. La façade REST/OpenAPI, les entités d’infrastructure, le monitoring réel, les notifications et les pièces jointes restent hors périmètre.

**Recommandation : nous pouvons passer à l’Étape 2 uniquement après une courte étape de durcissement ciblé.** L’Étape 1 est validée avec réserves, mais il est préférable de corriger d’abord la règle de promotion de rôle et d’ajouter les tests persistants des mutations. Il ne faut pas présenter PostgreSQL Docker comme opérationnel tant que l’adaptateur et Compose n’ont pas été exécutés avec succès.
