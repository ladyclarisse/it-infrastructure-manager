# Audit post-Étape 2.1 — Inventaire détaillé

**Projet :** IT Infrastructure Manager  
**Périmètre :** CRUD détaillé des interfaces réseau, logiciels, installations, localisations, relations et sous-types d’équipements réseau.  
**Date d’audit :** 27 août 2026.  
**Verdict :** **Étape 2.1 validée avec réserves d’environnement**.

## 1. Objet et périmètre

Cette itération complète le module d’inventaire sans introduire de monitoring, d’agent, de découverte réseau, de collecte SNMP ni de métriques temps réel. Le frontend utilise tRPC sous `/api/trpc`, conformément à l’architecture existante du dépôt. Une façade REST native est également livrée sous `/api/...`, en complément de tRPC, au-dessus des mêmes services métier.

Le périmètre livré couvre les opérations de lecture et d’écriture des interfaces réseau, logiciels, installations, localisations, relations et sous-types `router`, `switch`, `firewall`, `access_point` et `other`. Les mutations sont reliées au service métier et au contrôle RBAC serveur.

## 2. Éléments inspectés

| Domaine | Preuve inspectée | Résultat |
|---|---|---|
| Modèle de données | `drizzle/schema.ts`, migration existante | Les tables d’inventaire et leurs contraintes étaient déjà en place ; aucun changement de schéma requis dans cette itération |
| Persistance | `server/db.ts` | Helpers CRUD dédiés pour interfaces, logiciels, installations, localisations, relations et sous-types réseau |
| Métier | `server/services/inventory.ts` | Validation des références, IP/MAC/hostname, préfixe, VLAN, types de relations et audit des mutations |
| Contrat API | `server/routers.ts`, `server/rest/inventory.ts` | Procédures tRPC et façade REST list/get/create/update/remove avec RBAC d’écriture |
| Frontend | `client/src/pages/Infrastructure.tsx`, `InfrastructureCatalog.tsx` | Inventaire, détail, catalogue CRUD, filtres et états d’erreur |
| Navigation | `client/src/App.tsx`, `DashboardLayout.tsx` | Route `/infrastructure/catalogues` et entrée persistante `Catalogues` |
| Tests | 7 suites Vitest | 38 tests réussis |
| Build | `pnpm validate` | TypeScript, tests et build production réussis |
| Rendu | captures desktop 1280×720 et mobile 390×844 | Inventaire et catalogue visibles, responsive et cohérents avec le shell existant |

## 3. Matrice d’état fonctionnel

| Capacité | État | Constat objectif |
|---|---|---|
| Interfaces réseau | `IMPLEMENTED` | Liste, détail, création, modification, suppression, parent Asset, IP/MAC, VLAN, états et audit |
| Logiciels | `IMPLEMENTED` | Liste, détail, création, modification, suppression, éditeur, version, licence, statut et audit |
| Installations | `IMPLEMENTED` | Liste, détail, création, modification, suppression et validation Asset ↔ Software |
| Localisations | `IMPLEMENTED` | Liste, détail, création, modification, suppression et audit |
| Sous-types réseau | `IMPLEMENTED` | CRUD dédié et types contrôlés `router`, `switch`, `firewall`, `access_point`, `other` |
| Relations entre actifs | `IMPLEMENTED` | Lecture et CRUD contrôlé, prévention des références inexistantes et de l’auto-relation |
| Recherche et filtres Asset | `IMPLEMENTED` | Recherche SQL et filtres type, statut, environnement, localisation, page et taille bornées |
| Erreurs frontend | `IMPLEMENTED` | États d’échec de lecture et de chaque mutation affichés dans le catalogue |
| RBAC | `IMPLEMENTED` | Lecture pour les rôles opérationnels ; écriture réservée à `admin`, `it_manager`, `systems_network_admin` |
| Audit des mutations | `IMPLEMENTED` | Actions de création, modification et suppression écrites côté serveur sans secret |
| Tests unitaires métier | `TESTED` | 11 tests dans `server/inventory.service.test.ts` |
| Tests de contrat routeur | `TESTED` | 9 tests dans `server/infrastructure.router.test.ts` |
| Validation globale | `TESTED` | 38 tests, contrôle TypeScript et build production réussis |
| Persistance PostgreSQL réelle | `BLOCKED` | Aucun runtime PostgreSQL conteneurisé disponible dans l’environnement de validation actuel |
| Façade REST native | `IMPLEMENTED` | Ressources `/api/assets`, `/api/network-devices`, `/api/network-interfaces`, `/api/software`, `/api/software-installations`, `/api/locations` et `/api/relationships` |
| Monitoring et collecte | `PLANNED` | Aucun exporter, agent, SNMP, ping, métrique ou alerte introduit |

## 4. API livrée et autorisations

Le routeur `infrastructure` expose désormais les familles suivantes : `assets`, `servers`, `workstations`, `networkDevices`, `networkInterfaces`, `software`, `installations`, `locations` et `relationships`. Chaque famille spécialisée dispose d’une collection, d’un détail lorsque pertinent, et des mutations CRUD prévues par le périmètre.

Les procédures de lecture passent par `operationsProcedure`. Les mutations utilisent `inventoryManagerProcedure`, qui refuse les rôles ne disposant pas des droits d’administration d’inventaire. Les validations métier ne dépendent pas de l’interface : les actifs parents, logiciels, interfaces, types de relations, adresses et valeurs réseau sont contrôlés côté serveur.

Les codes d’erreur prévus sont `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND` et `INTERNAL_SERVER_ERROR`. Les erreurs de persistance spécifiques, notamment les doublons ou contraintes SQL, ne sont pas transformées en façade REST puisque cette façade n’est pas livrée.

## 5. Sécurité et traçabilité

Les contrôles d’autorisation sont exécutés par le backend et non par une simple visibilité conditionnelle dans React. Les mutations écrivent un événement d’audit avec le type de cible, son identifiant, l’action et des métadonnées limitées. Aucun mot de passe, token ou secret d’environnement n’est envoyé dans ces métadonnées.

La suppression d’un actif ou d’une entité liée reste soumise aux clés étrangères et aux comportements de suppression définis par le modèle existant. Les relations sont vérifiées avant création ou modification afin d’éviter des références orphelines et des liens vers le même actif.

## 6. Qualité du frontend

La page `/infrastructure` conserve la vue d’inventaire, les statistiques administratives, la recherche, les filtres et le détail relationnel. La route `/infrastructure/catalogues` ajoute un écran de gestion détaillée avec quatre registres : interfaces, logiciels, installations et localisations. Les sélecteurs de parent utilisent les données de la base plutôt que des exemples injectés.

Les captures desktop et mobile confirment que la navigation persistante, les cartes, les onglets de catalogue et le formulaire restent lisibles. Le contenu vide indique explicitement qu’aucun exemple n’a été injecté. Les erreurs de chargement et de mutation sont visibles dans la page.

## 7. Validation et limites

La commande unique `pnpm validate` a réussi pendant cet audit. Elle exécute le contrôle TypeScript, les sept suites Vitest et le build production. Le résultat observé est **38 tests réussis**, sans erreur TypeScript ni échec de build.

La façade REST a également été vérifiée en HTTP réel sur le serveur de développement : `GET /api/assets`, `GET /api/network-interfaces` et `POST /api/assets` répondent `401 UNAUTHORIZED` sans session, sans muter la base. Cette preuve confirme l’exposition des routes et leur protection ; elle ne remplace pas un test authentifié de succès.

Cette preuve ne remplace pas une validation d’intégration sur PostgreSQL réel. Le dépôt utilise encore l’adaptateur SQL fourni par l’environnement géré pour son exécution active ; le Dockerfile et la cible PostgreSQL sont documentés mais n’ont pas pu être démarrés dans le sandbox faute de runtime de conteneur. Cette limite reste `BLOCKED`, et aucune donnée fictive n’a été injectée pour la masquer.

## 8. Risques résiduels

| Gravité | Risque | Impact | Recommandation |
|---|---|---|---|
| Haute | Persistance PostgreSQL non exécutée dans cette itération | Les contraintes et types PostgreSQL ne sont pas validés en runtime réel | Exécuter Compose dans CI ou un environnement conteneurisé puis ajouter des tests d’intégration persistants |
| Moyenne | Tests REST authentifiés de succès absents | Les preuves HTTP actuelles confirment les routes et le refus anonyme, mais pas une mutation réussie avec session | Ajouter des tests d’intégration authentifiés dans un environnement de test maîtrisé, sans dupliquer les règles métier |
| Moyenne | Gestion de formulaires encore générique | Les champs spécialisés sont fonctionnels mais peu guidés par domaine | Ajouter des formulaires par ressource avec labels, formats et validations contextualisées |
| Faible | Erreurs de contraintes SQL non harmonisées | Les doublons peuvent remonter comme erreurs internes selon le driver | Mapper les erreurs de contrainte vers `CONFLICT` après validation PostgreSQL réelle |

## 9. Recommandation de passage

L’Étape 2.1 peut être considérée comme **validée fonctionnellement et testée au niveau service/routeur/frontend**. Il est raisonnable de poursuivre vers la prochaine étape uniquement si la réserve PostgreSQL est acceptée explicitement et planifiée comme un contrôle d’environnement, et non comme une fonctionnalité supposée opérationnelle.

La suite recommandée est de stabiliser l’intégration persistante PostgreSQL et d’ajouter des tests REST authentifiés de succès. La façade REST native est déjà livrée ; elle doit rester une couche mince au-dessus des services. Le monitoring ne doit être commencé qu’après cette stabilisation : il devra être introduit comme un module distinct, avec agents/exporters, collecte, rétention et alertes, sans réutiliser abusivement les statuts administratifs de l’inventaire.
