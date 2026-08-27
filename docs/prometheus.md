# Prometheus

Prometheus est le stockage et le moteur de requêtes des séries temporelles. L’application ne persiste pas les points CPU/RAM/disque/réseau en PostgreSQL ; elle interroge Prometheus à la demande via `server/services/monitoring.ts`.

## Configuration

La configuration versionnée se trouve dans `monitoring/prometheus/prometheus.yml`. Elle utilise un intervalle de scrape de 15 secondes, un timeout de 5 secondes et un job `node-exporter` ciblant `node-exporter:9100` dans le réseau Compose interne.

```yaml
scrape_configs:
  - job_name: node-exporter
    static_configs:
      - targets: ["node-exporter:9100"]
        labels:
          environment: lab
          exporter: node
          source: docker-compose
```

Le backend lit `PROMETHEUS_URL` et `PROMETHEUS_TIMEOUT_MS`. Ces variables sont de la configuration d’environnement et ne contiennent pas de secret dans l’exemple versionné.

## PromQL utilisé

| Indicateur | Requête | Unité |
|---|---|---|
| Disponibilité | `up{instance="host:9100"}` | 0 ou 1 |
| CPU | `100 - avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100` | pourcentage |
| RAM | `1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes` | pourcentage |
| Disque | `1 - sum(node_filesystem_avail_bytes) / sum(node_filesystem_size_bytes)` | pourcentage |
| Réception | `sum(rate(node_network_receive_bytes_total{device!="lo"}[5m]))` | octets/s |
| Émission | `sum(rate(node_network_transmit_bytes_total{device!="lo"}[5m]))` | octets/s |

Les valeurs de label sont échappées avant interpolation. Une métrique absente devient `null` dans la réponse applicative et ne devient jamais artificiellement `0`.

## Indisponibilité

Le client utilise `AbortController` et un timeout borné. Il distingue une réponse HTTP non valide, une erreur réseau, un timeout, une réponse Prometheus non valide et une série absente. Le frontend affiche `Monitoring backend unavailable` lorsque Prometheus ne répond pas.

La cible peut être `DOWN` lorsque Prometheus répond correctement et renvoie `up = 0`. Cette situation est différente d’un backend Prometheus indisponible, qui produit `backendStatus: UNAVAILABLE` et une observation `UNKNOWN`.
