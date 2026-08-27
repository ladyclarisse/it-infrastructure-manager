# RBAC — Étape 1.1

## Politique

L’autorisation est exécutée côté backend par le middleware tRPC et le service d’identité. Les rôles reconnus sont `admin`, `systems_network_admin`, `technician`, `it_manager` et `user`, affichés dans l’interface sous les libellés exacts `Administrateur`, `Administrateur systèmes/réseaux`, `Technicien`, `Responsable informatique` et `Utilisateur`.

La hiérarchie empêche un acteur d’attribuer un rôle supérieur à ses propres privilèges. La promotion vers `admin` est réservée à l’Administrateur. Le Responsable informatique peut gérer les comptes de niveau inférieur, mais ne peut ni promouvoir vers Administrateur ni modifier une cible de niveau supérieur. Technicien et Utilisateur ne disposent pas de la procédure de mutation d’accès. Toute auto-modification de rôle ou de statut est refusée.

| Opération | Administrateur | Responsable informatique | Technicien | Utilisateur |
|---|---:|---:|---:|---:|
| Consulter/rechercher les utilisateurs | IMPLEMENTED | IMPLEMENTED | BLOCKED | BLOCKED |
| Modifier un rôle inférieur ou égal | IMPLEMENTED | IMPLEMENTED avec hiérarchie | BLOCKED | BLOCKED |
| Attribuer Administrateur | IMPLEMENTED | BLOCKED | BLOCKED | BLOCKED |
| Désactiver/réactiver un autre compte autorisé | IMPLEMENTED | IMPLEMENTED avec hiérarchie | BLOCKED | BLOCKED |
| Modifier son propre rôle/statut | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Supprimer un utilisateur | PLANNED | PLANNED | PLANNED | PLANNED |

## Preuves

Les tests unitaires couvrent le refus d’un Responsable informatique vers Administrateur, le refus de Technicien et Utilisateur, l’interdiction d’auto-modification, le succès Administrateur au niveau service, le refus d’un compte désactivé et la validation du catalogue de rôles. Les tests sont réalisés avec des doubles de la couche de données pour ne pas prétendre à une persistance PostgreSQL indisponible.

Les tentatives autorisées ou refusées produisent des événements d’audit `USER_ACCESS_UPDATED` ou `USER_ACCESS_DENIED`. Les métadonnées contiennent la raison et la cible, mais aucun mot de passe, jeton ou secret. Le contrôle frontend est uniquement ergonomique et ne constitue pas une barrière de sécurité.

## Limites

La table `permissions` et l’association `role_permissions` sont modélisées et contraintes, mais la décision actuelle s’appuie encore sur une hiérarchie de rôles codée côté service. Une matrice de permissions dynamique est `PLANNED`. Les tests de persistance réelle des changements restent `BLOCKED — PostgreSQL runtime unavailable` dans la cible Docker ; la base active du runtime géré est MySQL via `mysql2`.
