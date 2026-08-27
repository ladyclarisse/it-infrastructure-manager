# Monitoring réel — Étape 3

## Périmètre livré

L’Étape 3 introduit une fondation de monitoring réel Linux basée sur Prometheus et Node Exporter. Un actif d’inventaire reste indépendant du monitoring : il peut exister sans cible, avec l’état `NOT_CONFIGURED`, sans être considéré comme `DOWN`.

Le modèle `monitoring_targets` conserve uniquement la configuration et la référence de l’Asset : type d’exporter, endpoint, port, activation, statut d’observation, labels et dates. Les séries temporelles ne sont pas copiées dans la base applicative ; Prometheus reste le système spécialisé pour leur stockage.

| Capacité | État | Preuve ou limite |
|---|---|---|
| Modèle Asset ↔ MonitoringTarget | IMPLEMENTED | Table avec FK vers `assets` et suppression en cascade |
| Type `NODE_EXPORTER` | IMPLEMENTED | Validation backend et configuration Prometheus versionnée |
| Types Windows/SNMP/Docker/Proxmox/Custom | PLANNED | Enum préparé, aucune collecte implémentée |
| Client Prometheus | IMPLEMENTED | Requêtes HTTP timeoutées et réponse typée |
| CPU/RAM/disque/réseau | IMPLEMENTED | Requêtes PromQL centralisées, valeurs nulles si métrique absente |
| UI Overview/Targets/Details | IMPLEMENTED | Routes `/monitoring`, `/monitoring/targets` et détail |
| Prometheus + Node Exporter runtime | BLOCKED | Runtime conteneur indisponible dans le sandbox de validation |
| Monitoring réel authentifié | TESTED | Contrats, validations et gestion backend indisponible testés ; chaîne complète à valider avec Compose |

## États

`NOT_CONFIGURED` signifie que la cible est désactivée ou n’a pas encore de configuration exploitable. `CONFIGURED` décrit une configuration activée avant observation. `UP` indique que Prometheus a retourné `up = 1`, `DOWN` que Prometheus a retourné `up = 0`, et `UNKNOWN` qu’aucune observation exploitable n’est disponible. Une indisponibilité de Prometheus est renvoyée distinctement comme `backendStatus: UNAVAILABLE` avec le message `Monitoring backend unavailable`.

## Flux réel

```text
Linux host → Node Exporter :9100 → Prometheus → Monitoring Service → API REST/tRPC → React
```

Les cibles sont configurées explicitement. Aucun scan réseau, balayage CIDR, Nmap, SNMP discovery ou agent propriétaire n’est inclus dans cette étape.

## Sécurité

Les routes nécessitent une session. Les lectures sont accessibles via le contrôle opérationnel existant ; les écritures sont réservées aux rôles `admin`, `it_manager` et `systems_network_admin`. L’endpoint saisi par un utilisateur n’est jamais utilisé par le backend pour contacter une URL arbitraire : seuls un hostname ou une adresse IP sans schéma, chemin ou query sont acceptés, et le port est borné de 1 à 65535. Le backend ne récupère les métriques qu’auprès de `PROMETHEUS_URL`, une configuration opérée par l’environnement.

## Données et audit

Les créations, modifications, activations/désactivations et suppressions de targets sont auditées. Les observations CPU, RAM, disque, réseau et disponibilité ne créent pas d’événements d’audit. Les secrets, tokens et credentials ne sont jamais inclus dans les métadonnées.
