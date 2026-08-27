import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const envExample = read("../.env.local.example");
const installation = read("../docs/installation.md");
const compose = read("../docker-compose.yml");
const validation = read("../docs/validation-operationnelle-etape-5.md");
const evidence = read("../docs/operations/fedora-runtime-evidence.md");
const validation52 = read("../docs/validation-operationnelle-etape-5-2.md");

describe("Étape 5 operational artifacts", () => {
  it("documents a non-secret local environment routed through Docker service names", () => {
    expect(envExample).toContain("DATABASE_URL=postgresql://it_manager:<LOCAL_SECRET>@postgres:5432/it_infrastructure");
    expect(envExample).toContain("POSTGRES_PASSWORD=<LOCAL_SECRET>");
    expect(envExample).toContain("PROMETHEUS_URL=http://prometheus:9090");
    expect(envExample).not.toMatch(/Bearer [A-Za-z0-9._-]{20,}/);
    expect(envExample).not.toMatch(/password=(?!<LOCAL_SECRET>)[^\s]+/i);
    expect(installation).toContain(".env.local.example");
    expect(installation).toContain("postgres:5432");
  });

  it("keeps the Compose database and monitoring service names explicit", () => {
    expect(compose).toContain("postgres:");
    expect(compose).toContain("prometheus:");
    expect(compose).toContain("node-exporter:");
    expect(compose).toContain("postgres_data:");
  });

  it("records PASS/PARTIAL/BLOCKED evidence without claiming unavailable runtime success", () => {
    expect(validation).toContain("**PARTIAL**");
    expect(validation).toContain("**BLOCKED — runtime conteneur indisponible dans le sandbox**");
    expect(validation).toContain("docker: command not found");
    expect(validation).toContain("17 fichiers de tests, 75 tests passés");
    expect(validation).not.toContain("Prometheus target = UP");
  });

  it("publishes the Fedora evidence protocol without requesting secrets", () => {
    expect(evidence).toContain("docker compose -p it-infrastructure-manager up -d --build");
    expect(evidence).toContain("up{job=\"node-exporter\"}");
    expect(evidence).toContain("Ne transmettre aucune valeur de `POSTGRES_PASSWORD`");
    expect(evidence).toContain("Ne jamais exécuter `docker compose down -v`");
    expect(validation52).toContain("BLOCKED — exécution Fedora réelle requise");
    expect(validation52).toContain("| Target UP | BLOCKED |");
    expect(validation52).not.toContain("| Target UP | PASS |");
  });
});
