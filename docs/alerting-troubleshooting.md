# Diagnostic Alerting

## Indisponibilité Prometheus

Si l’évaluation PromQL échoue par timeout, erreur réseau ou réponse HTTP non exploitable, le service retourne `backendStatus: UNAVAILABLE` et l’alerte reçoit l’état `UNKNOWN`. L’interface affiche `Prometheus unavailable` et n’interprète pas l’échec comme une collection vide. Vérifier `PROMETHEUS_URL`, la disponibilité du service Prometheus et la présence des targets dans sa page `/targets`.

## Aucune donnée d’alerte

`No alert data` signifie que l’API a répondu correctement et qu’aucune ligne d’alerte n’est persistée. Ce résultat est différent de `API unavailable`, qui indique un échec de lecture. Une réponse Prometheus sans série est également traitée avec prudence : elle peut résoudre une alerte existante uniquement après un appel réussi ; une panne du backend reste `UNKNOWN`.

## Règle refusée

Une expression vide, trop longue, contenant un séparateur de requête, un commentaire `//` ou des délimiteurs déséquilibrés est rejetée par le backend. Les expressions ne sont jamais évaluées contre une URL fournie dans le payload. Si un utilisateur reçoit `FORBIDDEN`, vérifier son rôle (`admin`, `it_manager` ou `systems_network_admin` pour les écritures) plutôt que de contourner l’API.

## Doublons

Une répétition d’observation doit retrouver le même fingerprint SHA-256, calculé avec l’ID de règle, l’ID de cible et les labels triés. Si des alertes sont dupliquées, vérifier que les labels ne changent pas à chaque polling et que la contrainte unique `alerts_fingerprint_unique` existe dans la base.

## Corrélation incident

Une alerte ne crée un incident que si elle est `CRITICAL`, `FIRING` et porte le label `create_incident=true`. Le service recherche ensuite une alerte identique ou un incident non résolu/non fermé pour la même cible. Une absence d’incident dans ce cas peut donc être normale si la condition a déjà été corrélée.

## Cycle incident

Les statuts invalides retournent `BAD_REQUEST`. Le chemin principal est `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`; les raccourcis depuis `OPEN` vers `IN_PROGRESS` ou `RESOLVED` sont explicitement autorisés. Les événements de timeline proviennent de `incident_history`, et non de données client reconstruites.

## Runtime bloqué

Si Docker ou Podman n’est pas disponible, ne pas simuler l’exporter, Prometheus ou une alerte `FIRING`. Marquer la validation inter-services `BLOCKED — Prometheus runtime unavailable` et réserver la preuve `UP`/`FIRING` à un environnement conteneurisé réel.
