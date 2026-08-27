import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const envExample = read("../.env.local.example");
const installation = read("../docs/installation.md");
const compose = read("../docker-compose.yml");
const validation = read("../docs/validation-operationnelle-etape-5.md");
const evidence = read("../docs/operations/fedora-runtime-evidence.md");
const validation52 = read("../docs/validation-operationnelle-etape-5-2.md");
const validation53 = read("../docs/validation-operationnelle-etape-5-3.md");
const backendDockerfile = read("../docker/backend.Dockerfile");
const frontendDockerfile = read("../docker/frontend.Dockerfile");
const dockerignore = read("../.dockerignore");
const wouterPatch = read("../patches/wouter@3.7.1.patch");
const buildPackage = read("../package.json");
const productionEntry = read("../server/_core/production.ts");
const appModule = read("../server/_core/app.ts");
const staticModule = read("../server/_core/static.ts");
const runtimeFollowup = read("../docs/validation-runtime-backend-prometheus.md");
const validation533 = read("../docs/validation-operationnelle-etape-5-3-3.md");
const uiuxCycle2 = read("../docs/uiux-audit-cycle-2.md");
const uiuxAuthAudit = read("../docs/uiux-auth-audit.md");
const uiuxStep7 = read("../docs/uiux-audit-etape-7.md");

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

  it("keeps the exact pnpm patch available before every Docker install", () => {
    for (const [name, dockerfile] of [
      ["backend", backendDockerfile],
      ["frontend", frontendDockerfile],
    ] as const) {
      const installLines = dockerfile
        .split("\n")
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.includes("RUN pnpm install"));
      expect(installLines.length, `${name} install count`).toBeGreaterThan(0);
      for (const { index } of installLines) {
        const precedingLines = dockerfile.split("\n").slice(0, index).join("\n");
        expect(precedingLines).toContain("COPY patches ./patches");
        expect(wouterPatch.length).toBeGreaterThan(0);
      }
    }
    expect(backendDockerfile).toContain("RUN pnpm install --prod --frozen-lockfile");
    expect(dockerignore).not.toMatch(/^patches(\/|$)/m);
    expect(dockerignore).toContain("node_modules");
  });

  it("keeps the production entrypoint independent from Vite", () => {
    expect(buildPackage).toContain("esbuild server/_core/production.ts");
    expect(productionEntry).not.toContain("./vite");
    expect(appModule).not.toMatch(/from [\"'].*vite[\"']/);
    expect(staticModule).not.toMatch(/from [\"'].*vite[\"']/);
    expect(compose).toContain("/etc/prometheus/prometheus.yml:ro,Z");
  });

  it("qualifies the UI/UX and authenticated-route audit without inventing tool results", () => {
    expect(uiuxCycle2).toContain("Impeccable | NON ÉVALUÉ");
    expect(uiuxCycle2).not.toContain("Impeccable /20");
    expect(uiuxAuthAudit).toContain("Aucune session OAuth active");
    expect(uiuxAuthAudit).toContain("ne peuvent donc pas être déclarés observés");
    expect(uiuxStep7).toContain("Impeccable");
    expect(uiuxStep7).toContain("NON ÉVALUÉ");
    expect(uiuxStep7).toContain("Routes authentifiées");
    expect(uiuxStep7).not.toContain("Impeccable : 18/20");
  });

  it("publishes the Fedora evidence protocol without requesting secrets", () => {
    expect(evidence).toContain("docker compose -p it-infrastructure-manager up -d --build");
    expect(evidence).toContain("up{job=\"node-exporter\"}");
    expect(evidence).toContain("Ne transmettre aucune valeur de `POSTGRES_PASSWORD`");
    expect(evidence).toContain("Ne jamais exécuter `docker compose down -v`");
    expect(validation52).toContain("BLOCKED — exécution Fedora réelle requise");
    expect(validation52).toContain("| Target UP | BLOCKED |");
    expect(validation52).not.toContain("| Target UP | PASS |");
    expect(validation53).toContain("ENOENT: no such file or directory");
    expect(validation53).toContain("| Docker build Fedora après correctif | FAIL |");
    expect(validation53).toContain("| Docker Compose healthchecks | À MESURER |");
    expect(validation53).toContain("| PostgreSQL réel et migrations | BLOCKED |");
    expect(validation53).not.toContain("| Prometheus / Node Exporter / target UP | PASS |");
    expect(runtimeFollowup).toContain("pnpm install --prod --frozen-lockfile");
    expect(runtimeFollowup).toContain("`:ro,Z`");
    expect(runtimeFollowup).toContain("Docker local | NON DISPONIBLE");
    expect(runtimeFollowup).toContain("SELinux local | NON DISPONIBLE");
    expect(runtimeFollowup).not.toContain("PostgreSQL applicatif | PASS");
    expect(validation533).toContain("132b7d50d243f1081d391d3384de9c188e9cb537");
    expect(validation533).toContain("eb5c96070e721fab9a09ea81abe429a4881734e3");
    expect(validation533).toContain(":ro,Z");
    expect(validation533).toContain("EAI_AGAIN");
    expect(validation533).toContain("git pull --ff-only origin main");
    expect(validation533).not.toContain("git reset --hard");
    expect(validation533).toContain("| PostgreSQL applicatif |");
    expect(validation533).toContain("| Prometheus applicatif |");
    expect(validation533).toContain("| NON VALIDÉ |");
  });
});
