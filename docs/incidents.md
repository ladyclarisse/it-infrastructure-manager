# Incidents

## Définition

Un incident est un événement nécessitant une intervention humaine. Il peut être créé manuellement par un rôle opérationnel ou corrélé automatiquement à une alerte critique dont les labels demandent explicitement la création d’un incident. Un incident n’est pas une métrique, une règle PromQL ou un ticket.

## Modèle

La table `incidents` conserve le titre, la description, la sévérité, le statut, la source (`MANUAL` ou `ALERT`), la cible de monitoring facultative, l’alerte d’origine facultative, l’utilisateur assigné, les timestamps d’acquittement et de résolution et les notes de résolution. Les clés étrangères vers `monitoring_targets`, `alerts` et `users` utilisent `set null` pour préserver l’historique lorsqu’une référence opérationnelle est retirée.

| Champ | Rôle | État |
|---|---|---|
| `alertId` | Alerte ayant déclenché la corrélation | IMPLEMENTED |
| `monitoringTargetId` | Cible technique concernée | IMPLEMENTED |
| `assignedToUserId` | Responsable humain, sans modèle d’équipe | IMPLEMENTED |
| `status` | Cycle de réponse contrôlé | IMPLEMENTED |
| `resolutionNotes` | Justification de la résolution | IMPLEMENTED |
| Ticket lié | Travail formel et SLA | PLANNED |

## Corrélation et déduplication

Une alerte critique peut créer un incident si le label persisté `create_incident=true` est présent. Avant création, le service vérifie l’existence d’un incident non résolu ou non fermé pour la même cible, ainsi que l’existence d’un incident rattaché à la même alerte. Une observation répétée ne crée donc ni une nouvelle alerte grâce au fingerprint, ni une succession d’incidents pour la même situation opérationnelle.

Après résolution, une nouvelle alerte présentant une nouvelle condition logique peut créer un nouvel incident. La réactivation implicite d’un incident résolu n’est pas effectuée silencieusement ; cette politique conserve une trace distincte des épisodes opérationnels.

## Affectation

L’affectation utilise `users` existant. Le backend exige un identifiant positif et vérifie que l’utilisateur existe et n’est pas désactivé. La mutation est protégée par le même périmètre opérationnel que les changements de statut et elle écrit un événement dans `incident_history` ainsi qu’une entrée dans l’audit général.

## API

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/api/incidents` | Liste filtrable par statut, sévérité, assigné, cible et dates |
| POST | `/api/incidents` | Création manuelle |
| GET | `/api/incidents/{id}` | Détail et timeline persistée |
| PATCH | `/api/incidents/{id}` | Transition contrôlée |
| POST | `/api/incidents/{id}/acknowledge` | Acquittement |
| POST | `/api/incidents/{id}/assign` | Affectation |
| POST | `/api/incidents/{id}/resolve` | Résolution avec notes facultatives |
| POST | `/api/incidents/{id}/close` | Fermeture |

Les procédures tRPC équivalentes vivent sous `incidents.*`. Toutes les routes refusent une requête sans session et les mutations refusent le rôle `user`.

## Limites

Aucun email, SMS, Slack, Telegram, push mobile ou ticket n’est créé dans cette étape. La notification et le ticketing seront traités dans des étapes ultérieures à partir des objets d’incident persistés.
