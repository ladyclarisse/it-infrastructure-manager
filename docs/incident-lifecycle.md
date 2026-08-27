# Cycle de vie Incident

## États

Le modèle conserve uniquement cinq états : `OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED` et `CLOSED`. Ils représentent respectivement la réception, l’acquittement, l’intervention, la résolution et la clôture administrative.

```text
OPEN
  ↓
ACKNOWLEDGED
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
CLOSED
```

Les transitions `OPEN → IN_PROGRESS` et `OPEN → RESOLVED` sont également autorisées pour les interventions rapides. Toutes les autres transitions sont rejetées par le service métier. En particulier, un incident `CLOSED` ne revient pas à `OPEN`, et un incident `RESOLVED` ne se réactive pas silencieusement.

## Effets métier

| Transition | Effet |
|---|---|
| `OPEN → ACKNOWLEDGED` | Renseigne `acknowledgedAt` et écrit l’événement |
| `ACKNOWLEDGED → IN_PROGRESS` | Marque le début d’intervention |
| `IN_PROGRESS → RESOLVED` | Renseigne `resolvedAt` et conserve les notes |
| `RESOLVED → CLOSED` | Ferme l’épisode sans effacer son historique |
| Toute transition interdite | Retour `BAD_REQUEST`, aucune mutation métier |

Chaque transition écrit une ligne `incident_history` avec l’acteur, l’action, le statut source, le statut cible et des métadonnées limitées. Elle écrit également l’audit général. Les secrets ne sont jamais ajoutés aux métadonnées.

## Affectation

L’action `assign` vérifie l’existence de l’utilisateur et son statut actif avant de mettre à jour `assignedToUserId`. L’affectation peut être retirée avec `null` depuis le contrat backend approprié ; l’interface courante propose l’affectation à l’utilisateur authentifié sans créer de modèle d’équipe.

## Résolution et nouvel épisode

Une alerte résolue puis observée à nouveau sous un fingerprint différent constitue un nouvel épisode logique. Le service ne transforme pas automatiquement l’ancien incident en incident ouvert. Cette décision évite de modifier un historique clôturé sans événement explicite et prépare une future politique de réouverture documentée.
