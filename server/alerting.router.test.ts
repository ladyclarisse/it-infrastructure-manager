import { describe, expect, it, vi } from "vitest";

const alertingMock = vi.hoisted(() => ({
  ALERT_SEVERITIES: ["INFO", "WARNING", "CRITICAL"], ALERT_STATUSES: ["PENDING", "FIRING", "RESOLVED", "UNKNOWN"], INCIDENT_STATUSES: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
  listConfiguredAlertRules: vi.fn().mockResolvedValue([]), getConfiguredAlertRule: vi.fn().mockResolvedValue({ id: 2, name: "Target down" }), createConfiguredAlertRule: vi.fn().mockResolvedValue({ id: 2 }), updateConfiguredAlertRule: vi.fn().mockResolvedValue({ id: 2 }), removeConfiguredAlertRule: vi.fn().mockResolvedValue({ success: true }), ensureInitialAlertRules: vi.fn().mockResolvedValue([]), getInitialAlertRuleDefinitions: vi.fn().mockReturnValue([]),
  listObservedAlerts: vi.fn().mockResolvedValue([]), getObservedAlert: vi.fn().mockResolvedValue({ id: 3, status: "FIRING" }), syncAlertObservation: vi.fn().mockResolvedValue({ alert: null, status: "UNKNOWN" }),
  listOpenIncidents: vi.fn().mockResolvedValue([]), getIncidentDetails: vi.fn().mockResolvedValue({ incident: { id: 4 }, history: [] }), createManualIncident: vi.fn().mockResolvedValue({ id: 4 }), assignIncident: vi.fn().mockResolvedValue({ id: 4 }), transitionIncident: vi.fn().mockResolvedValue({ id: 4, status: "ACKNOWLEDGED" }),
}));
vi.mock("./services/alerting", () => alertingMock);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
type Role = "admin" | "systems_network_admin" | "technician" | "it_manager" | "user";
function context(role?: Role): TrpcContext { return { user: role ? { id: 41, openId: `alerting-${role}`, name: role, email: `${role}@example.test`, loginMethod: "test", role, status: "active", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), disabledAt: null } : undefined, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] }; }

const rule = { name: "Target down", expression: "up == 0", severity: "CRITICAL" as const, forDurationSeconds: 60, enabled: true };

describe("alerting router", () => {
  it("rejects anonymous alert and incident reads", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.alertRules.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.alerts.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.incidents.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("allows operations roles to read the three alerting collections", async () => {
    const caller = appRouter.createCaller(context("technician"));
    await expect(caller.alertRules.list()).resolves.toEqual([]);
    await expect(caller.alerts.list()).resolves.toEqual([]);
    await expect(caller.incidents.list()).resolves.toEqual([]);
  });
  it("blocks user-level alert rule and incident mutations before service delegation", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.alertRules.create(rule)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.incidents.create({ title: "Blocked", severity: "WARNING" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(alertingMock.createConfiguredAlertRule).not.toHaveBeenCalled();
  });
  it("delegates manager mutations with the authenticated actor id", async () => {
    const caller = appRouter.createCaller(context("it_manager"));
    await expect(caller.alertRules.create(rule)).resolves.toMatchObject({ id: 2 });
    await expect(caller.alertRules.bootstrap()).resolves.toEqual([]);
    await expect(caller.incidents.create({ title: "Manual", severity: "WARNING" })).resolves.toMatchObject({ id: 4 });
    await expect(caller.incidents.acknowledge({ id: 4 })).resolves.toMatchObject({ id: 4 });
    expect(alertingMock.createConfiguredAlertRule).toHaveBeenCalledWith(41, expect.objectContaining(rule));
    expect(alertingMock.ensureInitialAlertRules).toHaveBeenCalledWith(41);
    expect(alertingMock.createManualIncident).toHaveBeenCalledWith(41, expect.objectContaining({ title: "Manual" }));
    expect(alertingMock.transitionIncident).toHaveBeenCalledWith(41, 4, "ACKNOWLEDGED");
  });
});
