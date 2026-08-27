# API monitoring

Le frontend consomme tRPC sous `/api/trpc`, tandis que les intégrations externes peuvent utiliser la façade REST native. Les deux transports appellent les mêmes services métier.

| Méthode | Route REST | Autorisation | État |
|---|---|---|---|
| GET | `/api/monitoring/targets` | session | IMPLEMENTED |
| GET | `/api/monitoring/targets/{id}` | session | IMPLEMENTED |
| POST | `/api/monitoring/targets` | `admin`, `it_manager`, `systems_network_admin` | IMPLEMENTED |
| PATCH | `/api/monitoring/targets/{id}` | `admin`, `it_manager`, `systems_network_admin` | IMPLEMENTED |
| DELETE | `/api/monitoring/targets/{id}` | `admin`, `it_manager`, `systems_network_admin` | IMPLEMENTED |
| GET | `/api/monitoring/targets/{id}/status` | session | IMPLEMENTED |
| GET | `/api/monitoring/targets/{id}/metrics` | session | IMPLEMENTED |

La forme de création minimale est :

```json
{
  "assetId": 42,
  "type": "NODE_EXPORTER",
  "endpoint": "node-exporter",
  "port": 9100,
  "enabled": true,
  "labels": { "environment": "lab" }
}
```

`NODE_EXPORTER` est le seul type effectivement collecté. `WINDOWS_EXPORTER`, `SNMP`, `DOCKER`, `PROXMOX` et `CUSTOM` sont préparés dans l’enum mais restent `PLANNED`.

Les réponses de métriques contiennent la target, `backendStatus`, `targetStatus`, `observedAt` et `metrics`. `backendStatus: UNAVAILABLE` signifie que Prometheus n’est pas joignable. `targetStatus: DOWN` signifie que Prometheus répond et a retourné `up = 0`. Une target désactivée renvoie `NOT_CONFIGURED` sans interroger Prometheus.

Les erreurs utilisent `401` pour une session absente, `403` pour un rôle insuffisant, `400` pour une validation invalide, `404` pour une ressource inconnue et `500` pour une erreur interne. Les endpoints n’acceptent pas d’URL arbitraire : l’endpoint est un hostname ou une adresse IP sans schéma ni chemin, et le port est borné.
