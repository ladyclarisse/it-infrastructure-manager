# Audit technique post-Étape 3 — Monitoring Foundation

## Conclusion

L’Étape 3 livre une fondation de monitoring réel sans métriques simulées. Prometheus reste le moteur de collecte et Node Exporter est le premier exporter effectivement supporté. L’inventaire décrit les actifs administrés ; `monitoring_targets` décrit leur configuration de collecte ; les observations restent dans Prometheus et sont lues à la demande.

## Matrice d’état

| Domaine | État | Preuve |
|---|---|---|
| Séparation inventaire/monitoring | IMPLEMENTED | FK `monitoring_targets.asset_id`, UI et services distincts |
| Cibles monitoring | IMPLEMENTED | CRUD service, tRPC et REST |
| Statuts | IMPLEMENTED | `NOT_CONFIGURED`, `CONFIGURED`, `UP`, `DOWN`, `UNKNOWN` |
| RBAC API | TESTED | Lectures pour rôles opérationnels ; mutations pour admin/IT manager/systems-network admin |
| Audit des mutations | IMPLEMENTED | Création, modification et suppression journalisées |
| SSRF | TESTED | Endpoint borné à hostname/IP sans schéma, chemin ni query |
| Prometheus | IMPLEMENTED | Client timeouté, JSON/HTTP/réseau différenciés, PromQL centralisé |
| Node Exporter | IMPLEMENTED | Service Compose v1.8.2, scrape job, healthcheck et durcissement |
| UI | IMPLEMENTED | Overview, Targets, détail, erreurs et empty states explicites |
| Tests | TESTED | `pnpm validate` : 45 tests, TypeScript et build réussis |
| Runtime applicatif | TESTED | Routes REST anonymes retournent `401 UNAUTHORIZED` |
| Runtime Docker/Prometheus | BLOCKED | Aucun runtime conteneur disponible dans le sandbox |
| Exporters Windows/SNMP/Docker/Proxmox | PLANNED | Aucun collecteur secondaire déclaré livré |

## Validation et limites

La validation applicative est reproductible avec `pnpm validate`, qui exécute le contrôle TypeScript, Vitest et le build Vite/esbuild. Les tests monitoring couvrent la validation SSRF, les résultats Prometheus indisponibles/invalides/vides, le mapping de disponibilité, le RBAC tRPC et les délégations CRUD. Le serveur local confirme le refus anonyme sur `/api/monitoring/targets` et `/api/monitoring/targets/1/status` avec HTTP 401.

La chaîne Prometheus → Node Exporter n’a pas été exécutée dans cet environnement, car aucun moteur Docker/Podman n’est disponible. Cette limite reste explicitement `BLOCKED`; elle ne doit pas être reformulée comme une collecte réelle validée. La prochaine validation opérationnelle doit démarrer Compose, vérifier `/metrics`, l’état de la target Prometheus puis une observation `UP` avec valeurs non nulles.

## Traçabilité Git

La contribution est destinée à la branche `main` du dépôt `ladyclarisse/it-infrastructure-manager`. Le commit de livraison Étape 3 est `4cdc7b6` (`feat(monitoring): establish Prometheus foundation`), poussé sur `main`. Aucune modification n’a été poussée sur une autre branche.
