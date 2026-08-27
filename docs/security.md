# Sécurité

Les mots de passe ne sont pas stockés par l’application : l’identité est déléguée à Manus OAuth et la session est vérifiée par le SDK. Les procédures protégées refusent l’absence de session et les comptes désactivés. Le RBAC est exécuté côté serveur, les entrées sont validées par Zod, les secrets sont fournis par l’environnement, et les actions sensibles sont journalisées.

La production devra activer HTTPS, des cookies sécurisés, une politique CORS restrictive, une limitation de débit et une rotation de secrets. Les fichiers futurs seront envoyés vers un stockage objet ; aucune donnée binaire ne devra être placée en base.
