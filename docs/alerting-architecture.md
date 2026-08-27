# Architecture Alerting

## Chaîne de responsabilité

```text
Node Exporter / autres exporters
              ↓
          Prometheus
              ↓
        Alert Rule metadata
              ↓  PromQL évaluée
             Alert
              ↓  corrélation explicite
           Incident
              ↓
       Affectation / résolution
              ↓
       Ticket futur (PLANNED)
```

Prometheus reste le moteur spécialisé de calcul et le stockage des séries temporelles. L’application conserve les métadonnées de règles et les épisodes d’alertes/incidents nécessaires à l’exploitation humaine. Cette séparation évite de transformer PostgreSQL en remplacement de Prometheus.

## Composants implémentés

| Couche | Fichier ou composant | État |
|---|---|---|
| Modèle SQL | `drizzle/schema.ts` | IMPLEMENTED |
| Migration | `drizzle/0005_cooing_wolfsbane.sql` | IMPLEMENTED |
| Persistence | `server/db.ts` | IMPLEMENTED |
| Métier | `server/services/alerting.ts` | IMPLEMENTED |
| Contrat tRPC | `server/routers.ts` | IMPLEMENTED |
| Contrat REST | `server/rest/alerting.ts` | IMPLEMENTED |
| Console | `client/src/pages/Alerts.tsx`, `Incidents.tsx` | IMPLEMENTED |
| Évaluation automatique | Scheduler ou webhook | DESIGNED / PLANNED |
| Alertmanager | Webhook sécurisé | DESIGNED / PLANNED |

## Décision Alertmanager

Alertmanager n’est pas ajouté à cette étape. Le projet dispose déjà d’une couche applicative pour stocker les épisodes, dédupliquer un fingerprint et corréler les alertes critiques. Ajouter immédiatement un webhook, un secret partagé, un routage et des événements resolved créerait une surface opérationnelle disproportionnée alors que l’évaluation périodique n’est pas encore arrêtée.

L’extension future pourra recevoir les événements Alertmanager via un endpoint authentifié, vérifier un secret rotatif géré par l’environnement, normaliser les labels non fiables, appliquer le même fingerprint et traiter les événements `firing`/`resolved`. Cette conception est `DESIGNED / PLANNED`, pas une intégration active.

## Sécurité de flux

Les utilisateurs standard ne peuvent pas écrire des règles ou déclencher une synchronisation. Les endpoints Prometheus sont contrôlés par la configuration serveur héritée de l’Étape 3. Les payloads sont bornés par Zod et les expressions par validation dédiée. Les IDs sont revalidés dans le service pour limiter les accès indirects aux objets.
