
- [x] Cloner et rattacher le dépôt GitHub `ladyclarisse/it-infrastructure-manager`, puis contribuer exclusivement sur la branche `main` et pousser la contribution après validation.
- [x] Auditer l’état initial réel du dépôt et documenter les décisions d’architecture.
- [x] Définir le modèle relationnel évolutif pour utilisateurs, rôles, permissions, audit et futures entités d’infrastructure.
- [x] Préparer les migrations, contraintes, index, timestamps et stratégies de suppression.
- [x] Sécuriser les variables d’environnement et fournir un exemple sans secret dans `docs/env.example.md` ; la création directe de `.env.example` est bloquée par la gestion sécurisée des variables du runtime.
- [x] Structurer l’API, la logique métier, l’accès aux données, l’authentification, l’autorisation, les services et l’audit.
- [x] Implémenter l’authentification avec le mécanisme d’identité réellement disponible, la session, la déconnexion et la protection des endpoints.
- [x] Implémenter le RBAC serveur pour Administrateur, Administrateur systèmes/réseaux, Technicien, Responsable informatique et Utilisateur.
- [x] Implémenter la consultation, la recherche, la modification de rôle et la désactivation des utilisateurs selon les permissions.
- [x] Enregistrer les connexions et actions sensibles dans les journaux d’audit.
- [x] Construire la console React professionnelle avec navigation, état d’authentification, écrans utilisateurs/rôles et états explicites.
- [x] Documenter le contrat REST/OpenAPI prévu sans déclarer implémentés les endpoints non livrés.
- [x] Préparer Dockerfiles, Docker Compose, PostgreSQL, healthchecks, volumes et réseau.
- [x] Prévoir l’extension future des notifications d’alertes et du stockage de fichiers hors base de données sans les déclarer livrés.
- [x] Ajouter les tests unitaires et d’intégration initiaux et une commande unique de validation.
- [x] Vérifier les migrations, la base, les tests, l’API et l’interface ; la validation inter-services Docker est BLOCKED car aucun runtime de conteneur n’est disponible dans le sandbox.
- [x] Pousser la contribution validée sur la branche GitHub `main`.
- [x] Ajouter les clés étrangères, contraintes relationnelles et stratégies de suppression dans le modèle RBAC.
- [x] Extraire la logique métier des routeurs vers une couche `server/services/` dédiée.
- [x] Journaliser explicitement la connexion réussie dans le flux OAuth/session avec les métadonnées disponibles.
- [x] Préparer la cible PostgreSQL documentée et le Dockerfile frontend ; l’exécution gérée reste sur son driver SQL fourni et l’alignement autonome complet est PLANNED.
- [x] Ajouter un script `pnpm validate` et des tests initiaux couvrant les flux utilisateurs.
- [x] Ajouter les clés étrangères et comportements `ON DELETE` directement dans le schéma Drizzle actif et sa migration.
- [x] Poursuivre l’extraction des services d’authentification, audit et catalogue RBAC hors des routeurs.
- [x] Ajouter les tests des mutations utilisateurs : changement de rôle, désactivation, réactivation et audit associé.
- [x] Tester la surface HTTP réelle `/api/trpc` et consigner le résultat : `auth.me` et `/` répondent HTTP 200 en runtime.
- [x] Réaliser l’audit technique post-Étape 1 complet, sans commencer l’Étape 2 ni modifier l’architecture.
- [x] Produire une matrice d’état avec preuves concrètes pour frontend, backend, base, Docker, auth, RBAC, audit, migrations, tests, documentation et GitHub.
- [x] Identifier précisément les fonctionnalités fonctionnelles, seulement implémentées, bloquées, non testées, les problèmes classés par gravité et la recommandation de passage à l’Étape 2.
- [x] Corriger côté backend l’escalade Responsable informatique → Administrateur et les auto-promotions.
- [x] Vérifier les chemins de modification de rôle, désactivation, réactivation et suppression éventuelle sans ajouter de surface non livrée.
- [x] Journaliser les changements de privilèges réussis et refusés sans secret ni mot de passe.
- [x] Ajouter les tests RBAC anti-escalade et les tests des mutations utilisateurs possibles sans simuler PostgreSQL.
- [x] Documenter précisément l’état `BLOCKED — PostgreSQL runtime unavailable` et la validation Docker statique.
- [x] Mettre à jour la sécurité, le RBAC, le README et l’audit post-Étape 1 avec la vulnérabilité corrigée.
- [x] Exécuter la validation finale, créer un commit dédié et pousser la correction sur `main`.
- [x] Vérifier explicitement la réactivation et documenter l’absence de suppression utilisateur livrée.
- [x] Créer et pousser le commit dédié Étape 1.1 sur `main` avant de clôturer la validation finale.
- [x] Committer et pousser `server/routers.ts` avec le passage explicite de `actorRole`.
- [x] Relancer `pnpm validate` sur un arbre Git propre identique à `github/main`.
- [x] Étape 2 : auditer les conventions existantes et figer le périmètre inventaire sans monitoring ni agents.
- [x] Concevoir le modèle commun `assets` et les domaines serveurs, postes, équipements réseau, interfaces, logiciels, localisations et relations.
- [x] Créer et appliquer les migrations avec contraintes, index, unicité, timestamps et suppressions explicites.
- [x] Implémenter les services et procédures API d’inventaire avec permissions backend, recherche et filtres.
- [x] Construire les écrans frontend d’inventaire, détails, filtres et relations en réutilisant le shell existant.
- [x] Ajouter les tests unitaires et d’intégration disponibles sans simuler monitoring ou PostgreSQL non disponible.
- [x] Documenter le modèle, l’API, les états `PLANNED`, `DESIGNED`, `IMPLEMENTED`, `TESTED` et `BLOCKED`.
- [x] Valider, versionner et pousser l’Étape 2 sur la branche `main`.
- [x] Ajouter des états d’erreur UI explicites pour les requêtes et mutations d’inventaire.
- [x] Ajouter une gestion UI explicite de création de relations ou qualifier la capacité comme DESIGNED sans la revendiquer comme interface livrée.
- [x] Ajouter des tests d’intégration du routeur inventaire pour permissions, filtres, création, détail et suppression sans prétendre à PostgreSQL.
- [x] Documenter explicitement l’état exact `TESTED` pour le périmètre inventaire avec ses preuves associées.
- [x] Ajouter un état d’erreur UI explicite pour l’échec de suppression d’un actif.
- [x] Étendre les tests du routeur inventaire aux filtres, détail, création autorisée et suppression autorisée/refusée.
- [x] Étape 2.1 — ajouter les CRUD dédiés des interfaces réseau, logiciels, installations et localisations via le transport tRPC existant.
- [x] Étape 2.1 — distinguer et administrer les sous-types réseau `router`, `switch`, `firewall`, `access_point` et `other`.
- [x] Étape 2.1 — valider côté service les adresses IP/MAC, hostnames, préfixes, VLAN, ressources parentes et types de relations.
- [x] Étape 2.1 — auditer les mutations inventaire et fournir des messages d’erreur UI explicites.
- [x] Étape 2.1 — ajouter les tests unitaires service et routeur pour les permissions, références, filtres, détails, CRUD et audits.
- [x] Étape 2.1 — mettre à jour l’API, l’inventaire et les guides de données avec le statut réel `IMPLEMENTED`/`TESTED`.
- [x] Étape 2.1 — qualifier la validation des mutations sur une base PostgreSQL réelle comme `BLOCKED — PostgreSQL runtime unavailable` ; aucune prétention d’exécution n’est faite.
- [x] Étape 2.1 — ajouter une façade HTTP REST native au-dessus des services ; elle est désormais exposée sous `/api/...` et conserve tRPC sous `/api/trpc` pour le frontend.
- [x] Aligner `docs/api-inventory.md`, `README.md` et l’audit Étape 2.1 sur la façade REST désormais implémentée.
- [x] Vérifier réellement la surface HTTP REST : `GET /api/assets`, `GET /api/network-interfaces` et `POST /api/assets` refusent l’anonyme avec `401 UNAUTHORIZED` sans mutation.
- [x] Documenter exhaustivement les ressources REST livrées et la séparation restante avec tRPC frontend.
- [x] Étape 3 — auditer l’architecture existante et préserver la séparation inventaire/monitoring.
- [x] Étape 3 — créer le modèle `monitoring_targets`, les statuts distincts et les permissions monitoring.
- [x] Étape 3 — configurer Prometheus et Node Exporter avec Docker Compose, healthchecks et limites documentées.
- [x] Étape 3 — implémenter le service Prometheus avec timeouts, erreurs différenciées et PromQL centralisé.
- [x] Étape 3 — exposer l’API REST monitoring authentifiée et protégée par RBAC.
- [x] Étape 3 — construire l’interface monitoring sans métriques simulées et avec états explicites.
- [x] Étape 3 — ajouter les tests, la documentation, la validation statique et le push sur `main` ; validation runtime Docker/Prometheus explicitement `BLOCKED` faute de runtime conteneur.
- [x] Étape 3 — compléter les tests monitoring couvrant CRUD target, RBAC, audit et chemins métier réels pour `NOT_CONFIGURED`/observation.
- [x] Étape 3 — vérifier les contrôles runtime applicatifs disponibles dans le sandbox, au minimum le refus anonyme des routes monitoring, en conservant Docker/Prometheus `BLOCKED`.
- [x] Étape 3 — créer le commit final, pousser sur `main` et consigner le hash de livraison dans l’audit ; synchronisation finale `2118a6d`.

# Étape 4 — Alertes et Incidents

- [x] Auditer et documenter la séparation Metric / Alert / Incident / Ticket et l’architecture de corrélation.
- [x] Créer les modèles persistants `alert_rules`, `alerts`, `incidents` et l’historique métier avec index, FK et contraintes.
- [x] Implémenter les règles PromQL contrôlées, les états d’alerte, la déduplication et la corrélation Alert → Incident.
- [x] Implémenter le cycle de vie Incident, l’affectation utilisateur, le RBAC et l’audit des mutations.
- [x] Exposer les APIs tRPC et REST authentifiées pour règles, alertes et incidents.
- [x] Construire les écrans Alerts, Incidents, détail, filtres, timeline et états d’erreur explicites.
- [x] Ajouter les tests service, routeur, REST, RBAC, audit, transitions et déduplication.
- [x] Mettre à jour la documentation, les diagrammes et créer `docs/audit-post-etape-4.md`.
- [x] Exécuter `pnpm validate`, conserver les validations Docker/Prometheus/PostgreSQL en `BLOCKED` si indisponibles, puis pousser sur `main`.
- [x] Étape 4 — ajouter les filtres incidents par utilisateur assigné et par monitoring target.
- [x] Étape 4 — enrichir les alertes affichées avec cible, règle, durée et statut opérationnel.
- [x] Étape 4 — créer le commit final Étape 4, pousser sur `main` et consigner le hash final dans l’audit : `569674a`.
- [x] Étape 4 — committer et pousser la mise à jour finale de l’audit et du TODO, puis vérifier l’arbre Git propre sur `main` : `e3e6d84`.
- [x] Étape 4 — consigner dans l’audit le hash réellement final après le dernier commit synchronisé : commit fonctionnel `569674a`, trace documentaire `e3e6d84`.
- [x] Étape 4 — mettre à jour `docs/audit-post-etape-4.md` avec le hash documentaire final réellement synchronisé `e3e6d84`, puis pousser cette modification.
- [x] Étape 4 — vérifier l’arbre Git propre sur `main` après le dernier push et clôturer la traçabilité.

# Nouveau prompt joint — à exécuter

- [x] Lire le nouveau prompt joint et extraire toutes ses exigences vérifiables.
- [x] Implémenter, tester, documenter et livrer les exigences du nouveau prompt après audit du projet : consolidation applicative, documentation et validation statique livrées ; critères runtime Docker/PostgreSQL/Prometheus explicitement **BLOCKED — aucun runtime conteneurisé disponible**.

# Étape 4.1 — Consolidation PostgreSQL réelle

- [x] Finaliser l’audit des divergences MySQL/PostgreSQL et consigner le diagnostic avant modification.
- [x] Convertir le schéma Drizzle vers `pgTable`, `pgEnum`, identités PostgreSQL et timestamps sans `onUpdateNow`.
- [x] Configurer Drizzle Kit et le driver runtime `node-postgres`, avec `pg` utilisé et `mysql2` supprimé.
- [x] Générer et vérifier une chaîne de migrations PostgreSQL depuis une base vierge, en conservant l’historique MySQL.
- [x] Aligner Compose, exemples d’environnement, README, installation, déploiement et troubleshooting.
- [x] Exécuter la stack Docker, les migrations persistantes PostgreSQL, les healthchecks et la preuve Prometheus/Node Exporter si le runtime est disponible : **BLOCKED — runtime conteneur indisponible dans le sandbox**.
- [x] Ajouter ou adapter les tests PostgreSQL réels et publier le rapport de validation sans confondre tests mockés et persistance réelle : **BLOCKED — aucune instance PostgreSQL réelle disponible ; invariants statiques TESTED et rapport publié**.
- [x] Versionner et pousser la consolidation PostgreSQL sur `main` après validation, en consignant les éventuels blocages exacts : `9015529`.
- [x] Étape 4.1 — mettre à jour explicitement le guide troubleshooting/PostgreSQL avec les diagnostics `node-postgres`, `drizzle-pg`, limites runtime Docker et erreurs attendues.
- [x] Étape 4.1 — requalifier les tests PostgreSQL persistants en `BLOCKED` tant qu’aucune instance réelle n’est disponible ; conserver les tests d’invariants en `TESTED`.
- [x] Étape 4.1 — créer le commit final de consolidation PostgreSQL, pousser sur `main` et consigner son hash exact dans le rapport de validation : `9015529`.
- [x] Étape 4.1 — requalifier l’item global du nouveau prompt en `BLOCKED` tant que Docker/PostgreSQL/Prometheus réels ne sont pas prouvés dans un environnement disponible.
- [x] Étape 4.1 — conserver l’absence de tests persistants PostgreSQL réels comme `BLOCKED`, sans les présenter comme exécutés.
- [x] Étape 4.1 — produire les preuves runtime manquantes : **BLOCKED — docker/podman/nerdctl absents du sandbox**, donc aucune preuve artificielle de healthcheck, migration persistante, scrape ou chaîne monitoring → alert → incident.

# Nouveau prompt joint — à traiter

- [x] Lire le prompt joint et extraire ses critères d’acceptation.
- [x] Auditer le projet selon ces critères et définir les changements nécessaires.
- [x] Implémenter les exigences réalisables sans régression, puis ajouter les tests associés : test dédié `server/step5.operational-artifacts.test.ts` ajouté et passé.
- [x] Mettre à jour la documentation et qualifier précisément les blocages éventuels.
- [x] Valider, committer et pousser la livraison sur `main` si les contrôles réussissent : validation statique PASS, runtime opérationnel PARTIAL/BLOCKED, commit `1618fa8` poussé.

# Étape 5 — Validation opérationnelle réelle

- [x] Auditer l’état Git, Compose, PostgreSQL, migrations, backend, Prometheus, Node Exporter, alerting et tests.
- [x] Préparer l’environnement local reproductible sans committer de secrets : `.env.local.example` référencé dans `docs/installation.md`, aucun secret versionné.
- [x] Exécuter `docker compose config`, `up`, `ps`, logs, migrations et redémarrage si le runtime est disponible : **BLOCKED — `docker` absent, commandes en échec avec exit 127**.
- [x] Exécuter les tests persistants PostgreSQL réels distincts des tests unitaires, ou qualifier ce contrôle BLOCKED avec la raison exacte : **BLOCKED — aucune instance réelle ; 72 tests statiques/unitaires passés**.
- [x] Vérifier réellement Prometheus, Node Exporter, cible UP, PromQL, Alert, Incident et Audit, ou qualifier chaque contrôle BLOCKED : **BLOCKED — stack conteneur indisponible, aucune preuve inventée**.
- [x] Tester les endpoints publics/protégés, l’absence de secret et les limites de sécurité : `/` 200, cinq routes monitoring/alertes/incidents `401`, audit des fichiers versionnés sans finding.
- [x] Créer `docs/validation-operationnelle-etape-5.md` avec commandes, preuves et statuts PASS/PARTIAL/BLOCKED/FAIL.
- [x] Exécuter `pnpm validate`, versionner et pousser la clôture Étape 5 sur `main` : 16 fichiers, 72 tests, TypeScript/build PASS ; commit `1618fa8` poussé.
- [x] Étape 5 — créer ou mettre à jour une convention d’environnement local reproductible non secrète et la référencer dans la documentation Docker : `.env.local.example` et `docs/installation.md`.
- [x] Étape 5 — tester les routes protégées monitoring et incidents, puis relancer un audit de secrets sur le dépôt hors dépendances et artefacts : toutes les routes testées répondent `401`, audit sans finding.
- [x] Étape 5 — ajouter un test automatisé dédié au modèle `.env.local.example`, aux variables PostgreSQL/Prometheus et au rapport opérationnel : 3 tests passés.

# Prompt joint 10 — à traiter

- [x] Lire le prompt joint et extraire ses critères d’acceptation.
- [x] Auditer le projet et définir les changements techniques requis.
- [x] Implémenter les exigences réalisables et ajouter les tests associés.
- [x] Mettre à jour la documentation et qualifier les limites runtime.
- [x] Valider, versionner et pousser la livraison sur `main` : validation statique PASS, runtime Fedora à mesurer, commit `b925b72` poussé.

# Étape 5.1 — Runbook de validation Fedora

- [x] Auditer le commit `b144a77` et préserver les livrables Étape 5 existants sans réécriture inutile.
- [x] Vérifier le contrat Compose, les variables `.env.local.example`, les migrations `drizzle-pg/` et les scripts réellement disponibles.
- [x] Créer `docs/runbook-validation-fedora.md` avec les commandes exactes Docker, PostgreSQL, Prometheus, Node Exporter, Alert, Incident, Audit et persistance.
- [x] Créer un script de validation runtime sûr, sans secrets affichés, sans suppression de volumes et sans bypass OAuth/RBAC, si pertinent : `scripts/validate-runtime.sh`.
- [x] Ajouter les tests nécessaires aux nouveaux artefacts et mettre à jour la matrice de validation sans déclarer Fedora PASS : 3 tests du runbook/script passés ; validation globale 75 tests.
- [x] Exécuter `pnpm validate`, versionner et pousser la livraison Étape 5.1 sur `main` : 17 fichiers, 75 tests, TypeScript/build PASS ; commit `b925b72` poussé.

# Prompt joint 11 — à traiter

- [x] Lire le prompt joint et extraire ses critères d’acceptation.
- [x] Auditer l’état actuel du dépôt et identifier les corrections minimales.
- [x] Implémenter les corrections réalisables avec leurs tests associés.
- [x] Mettre à jour la documentation et qualifier les limites runtime.
- [x] Valider, versionner et pousser la livraison sur `main`.

# Étape 5.2 — Qualification runtime Fedora réelle

- [x] Préserver l’existant et confirmer que la qualification Fedora ne sera pas simulée depuis le sandbox.
- [x] Compléter le runbook avec accès Docker sans sudo, frontend, healthchecks et collecte avant/après restart.
- [x] Créer `docs/operations/fedora-runtime-evidence.md` pour encadrer les sorties expurgées à renvoyer.
- [x] Créer le rapport structuré Étape 5.2 avec domaines PASS/BLOCKED/À MESURER et limitations actuelles.
- [x] Ajouter les tests strictement nécessaires aux nouveaux artefacts documentaires, sans transformer les tests unitaires en intégration artificielle.
- [x] Exécuter `pnpm validate`, versionner et pousser la livraison sur `main` sans déclarer Fedora validé.

# Étape 5.3 — Correction du build Docker pnpm patch

- [x] Auditer et documenter la cause exacte de l’ENOENT du patch pnpm dans les deux Dockerfiles.
- [x] Corriger les Dockerfiles pour copier `patches/` avant chaque `pnpm install` sans supprimer le patch ni désactiver `frozen-lockfile`.
- [x] Ajouter ou vérifier un `.dockerignore` qui conserve `patches/` dans le contexte Docker.
- [x] Ajouter les tests nécessaires pour verrouiller l’ordre des COPY et la présence du patch.
- [x] Exécuter `pnpm validate` et qualifier séparément le build Docker Fedora réellement observé.
- [x] Documenter les sorties Fedora fournies, sans déclarer PostgreSQL/Prometheus/Alert/Incident validés par simple démarrage Docker.
- [x] Créer le commit dédié et pousser la correction sur `main` via le mécanisme de versionnement du projet.

# Étape 5.3.1 — Requalification du stage backend runtime

- [x] Enregistrer l’échec Fedora fourni sur le stage backend runtime sans le reclasser artificiellement en PASS.
- [x] Vérifier chaque instruction `pnpm install` des stages backend build/runtime et frontend build avec le chemin exact du patch.
- [x] Renforcer le test afin de contrôler chaque installation concernée, pas seulement la première occurrence.
- [x] Mettre à jour le rapport Étape 5.3 pour distinguer l’état du dépôt courant de la preuve Fedora échouée/stale éventuelle.
- [x] Exécuter `pnpm validate` et créer un checkpoint dédié ; laisser le build Fedora réel en FAIL tant qu’un nouveau résultat post-correctif n’est pas fourni.

# Étape 5.3.2 — Résolution divergence Git / livraison réelle

- [x] Auditer le checkout courant, HEAD, remote, branche et présence réelle de la correction Docker.
- [x] Réappliquer la correction uniquement si elle est absente du checkout courant.
- [x] Vérifier chaque stage Docker, `.dockerignore`, `patchedDependencies` et le patch réel.
- [x] Exécuter `pnpm validate` et vérifier les contenus via Git avant livraison.
- [x] Sauvegarder la version, vérifier `origin/main` et fournir le hash complet réellement disponible.
- [x] Documenter la cause de divergence et demander une nouvelle relance du build Fedora sans qualifier PostgreSQL/Prometheus/Alert/Incident.

# Étape runtime suivante — Backend Vite et Prometheus SELinux

- [x] Auditer package.json, build backend, références Vite dans le bundle et Compose Prometheus.
- [x] Corriger le runtime backend selon la cause démontrée, sans déplacer Vite aveuglément ni casser la séparation build/runtime.
- [x] Corriger le bind mount Prometheus avec l’option SELinux portable appropriée, sans désactiver SELinux ni élargir les permissions hôte.
- [x] Ajouter ou renforcer les tests de régression backend runtime et Compose.
- [x] Exécuter `pnpm validate` et documenter précisément les résultats.
- [x] Documenter que le rebuild et les healthchecks Fedora réels restent à confirmer depuis cet environnement sans Docker.
- [x] Créer un checkpoint uniquement après correction et validation, sans qualifier PostgreSQL/Prometheus applicatif/Alert/Incident/persistance sans preuves dédiées.

# Étape 5.3.3 — SELinux Prometheus et EAI_AGAIN Fedora

- [x] Inspecter l’historique Git et les fichiers concernés avant modification.
- [x] Confirmer pourquoi `:Z` manque dans le checkout Fedora et corriger minimalement `docker-compose.yml` sans toucher au patch Wouter.
- [x] Documenter le traitement infrastructure de `EAI_AGAIN` sans désactiver de sécurité ni ajouter de contournement projet.
- [x] Documenter la procédure de redémarrage et les scénarios applicatifs PostgreSQL, Prometheus, Alert, Incident et persistance.
- [x] Renforcer les tests sur le montage SELinux et l’absence de modification Wouter.
- [x] Exécuter `pnpm validate`, fournir les fichiers/commit et distinguer VALIDÉ de NON VALIDÉ.
- [x] Créer un checkpoint après correction et validation, sans inférer une validation applicative d’un build Docker.
