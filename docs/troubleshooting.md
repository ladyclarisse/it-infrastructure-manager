# Dépannage

Si la console affiche l’écran de connexion, vérifier la session OAuth et les variables `VITE_APP_ID`, `OAUTH_SERVER_URL` et `VITE_OAUTH_PORTAL_URL`. Si une procédure répond `UNAUTHORIZED`, la session est absente ou expirée. Si elle répond `FORBIDDEN`, le rôle serveur ne possède pas la permission requise.

Pour une base indisponible, vérifier `DATABASE_URL`, la disponibilité du service et le healthcheck. Les logs applicatifs du runtime restent la source de diagnostic ; aucune erreur ne doit être masquée par l’interface.
