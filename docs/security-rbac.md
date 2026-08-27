# Sécurité et RBAC inventaire

L’inventaire utilise les procédures protégées existantes. Les rôles `admin`, `it_manager` et `systems_network_admin` peuvent créer, modifier et supprimer des actifs via le backend. Les rôles `technician` et `user` peuvent consulter l’inventaire via `operationsProcedure`, mais ne peuvent pas muter les données. Les comptes anonymes ou désactivés sont refusés avant l’accès métier.

Le frontend masque ou affiche des actions pour l’ergonomie, mais le contrôle de sécurité est exclusivement côté serveur. Chaque mutation vérifie les entrées avec Zod, valide les identifiants positifs et délègue à `server/services/inventory.ts`. Les références inexistantes sont refusées par les clés étrangères et les relations auto-référentes sont rejetées par le service.

Les événements suivants sont journalisés : `ASSET_CREATED`, `ASSET_UPDATED`, `ASSET_DELETED` et `ASSET_RELATIONSHIP_CREATED`. L’audit conserve acteur, action, cible, métadonnées et horodatage ; il ne reçoit aucun mot de passe, token, clé API ni secret. Une matrice de permissions atomiques `assets.read`, `assets.create`, `assets.update` et `assets.delete` est conçue dans le modèle relationnel mais sa résolution dynamique reste `PLANNED`, conformément au choix de ne pas réécrire le RBAC de l’Étape 1.

Les données de laboratoire doivent utiliser `environment = LAB` et rester explicitement identifiables. Aucun agent, SNMP, exporter, scan réseau ou connexion automatique vers le laboratoire futur n’est actif dans cette étape.
