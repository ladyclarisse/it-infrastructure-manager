INSERT INTO "roles" ("slug", "name", "description")
VALUES
  ('admin', 'Administrateur', 'Accès complet à la console.'),
  ('systems_network_admin', 'Administrateur systèmes/réseaux', 'Gestion de l’infrastructure et du monitoring.'),
  ('technician', 'Technicien', 'Gestion opérationnelle des équipements et tickets.'),
  ('it_manager', 'Responsable informatique', 'Supervision globale et reporting.'),
  ('user', 'Utilisateur', 'Accès limité à ses équipements et tickets.')
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description";
