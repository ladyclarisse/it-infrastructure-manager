# Sécurité

L’identité applicative est déléguée à Manus OAuth : aucun mot de passe n’est stocké ou hashé dans cette application. Le callback vérifie le nonce OAuth, le SDK signe et vérifie les sessions JWT, et les cookies sont `httpOnly` et `secure` en contexte HTTPS. Les secrets sont injectés par l’environnement et ne doivent pas être commités.

Les procédures protégées refusent l’absence de session et les comptes `disabled`. Le RBAC est vérifié côté serveur. La correction Étape 1.1 ajoute une hiérarchie explicite : un Responsable informatique ne peut pas promouvoir un utilisateur vers Administrateur ; un Technicien ou un Utilisateur ne peut pas appeler la mutation d’accès ; un utilisateur ne peut pas modifier son propre rôle ou statut ; et une cible d’un niveau supérieur ne peut pas être modifiée par un acteur inférieur. Les tentatives refusées sont journalisées avec une raison, sans mot de passe ni secret.

La règle de promotion Administrateur reste réservée à l’Administrateur. Les procédures de création locale, suppression d’utilisateur, CORS explicite, limitation de débit et immutabilité native des journaux ne sont pas livrées à cette étape. Les fichiers futurs seront envoyés vers un stockage objet ; aucune donnée binaire ne doit être placée en base.

Avant exposition publique, activer HTTPS partout, une politique CORS restrictive, une limitation de débit, une rotation des secrets et des tests d’intégration persistants. La cible PostgreSQL/Docker demeure `BLOCKED — PostgreSQL runtime unavailable` dans le runtime audité.
