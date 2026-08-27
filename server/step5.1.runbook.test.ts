import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const runbook = read("../docs/runbook-validation-fedora.md");
const script = read("../scripts/validate-runtime.sh");

describe("Étape 5.1 Fedora validation artifacts", () => {
  it("starts with the required Docker diagnostics and uses the project services", () => {
    expect(runbook).toContain("docker --version");
    expect(runbook).toContain("docker compose version");
    expect(runbook).toContain("docker info");
    expect(runbook).toContain("docker ps");
    expect(runbook).toContain("docker compose -p it-infrastructure-manager config");
    expect(runbook).toContain("postgres");
    expect(runbook).toContain("prometheus");
    expect(runbook).toContain("node-exporter");
    expect(runbook).toContain("drizzle-pg.config.ts");
  });

  it("documents the complete evidence chain without claiming Fedora success", () => {
    expect(runbook).toContain("Alert → Incident → incident_history → audit_logs");
    expect(runbook).toContain("À MESURER");
    expect(runbook).toContain("ne déclare aucune validation Docker");
    expect(runbook).toContain("docker compose -p it-infrastructure-manager restart backend postgres prometheus node-exporter");
  });

  it("keeps the executable checker non-destructive and secret-safe", () => {
    expect(script).toContain("docker info >/dev/null");
    expect(script).toContain("source .env.local");
    expect(script).toContain("/api/monitoring/targets");
    expect(script).toContain("/api/alerts");
    expect(script).toContain("/api/incidents");
    expect(script).toContain("/-/healthy");
    expect(script).toContain("up{job=\"node-exporter\"}");
    expect(script).not.toMatch(/docker compose[^\n]+down\s+-v/);
    expect(script).not.toMatch(/rm\s+-rf/);
    expect(script).not.toMatch(/echo\s+\$\{?(POSTGRES_PASSWORD|JWT_SECRET)/);
  });
});
