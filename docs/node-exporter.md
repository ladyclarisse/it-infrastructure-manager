# Node Exporter Linux

## Rôle

Node Exporter est le premier exporter réellement supporté. Il expose les métriques système Linux sur le port `9100`; Prometheus les collecte et le service monitoring les lit.

## Compose

Le service Compose utilise l’image épinglée `prom/node-exporter:v1.8.2`, le montage `/:/host:ro,rslave`, `--path.rootfs=/host`, `pid: host`, `read_only: true`, `no-new-privileges` et `cap_drop: ALL`. Le port `9100` n’est pas publié sur l’hôte : Prometheus y accède via le réseau Docker interne.

Ce montage est nécessaire pour observer les systèmes de fichiers de l’hôte. Il ne transforme pas automatiquement le conteneur en observateur complet de toutes les namespaces : les métriques dépendantes d’autres permissions, namespaces ou sous-systèmes doivent être vérifiées séparément. Le montage racine est en lecture seule, mais il reste sensible ; il doit être limité à un hôte de supervision maîtrisé.

## Connexion d’une VM Linux du laboratoire

Aucune machine réelle ni aucun réseau réel ne sont modifiés par le projet. Pour une VM de laboratoire, installer Node Exporter depuis une source vérifiée, créer un service systemd dédié, écouter sur `9100` sur l’interface de supervision, autoriser uniquement l’IP du collecteur dans le firewall, puis tester `http://VM_LAB:9100/metrics` depuis Prometheus.

Dans Prometheus, ajouter ensuite la cible explicite `VM_LAB:9100` dans un job contrôlé, avec des labels `environment`, `asset_tag` et `exporter`. Enfin, créer une `MonitoringTarget` dont l’Asset parent correspond à la VM et dont l’endpoint/port correspondent à la cible Prometheus.

## Sécurité

Ne pas exposer `9100` à Internet. Ne pas utiliser de privilèges supplémentaires sans preuve de nécessité. La procédure doit être appliquée uniquement à une VM de laboratoire autorisée, jamais à un système ou réseau réel sans validation opérationnelle.
