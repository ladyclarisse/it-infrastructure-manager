import { describe, expect, it, vi } from "vitest";

const monitoringMock = vi.hoisted(() => ({
  MONITORING_TYPES: ["NODE_EXPORTER", "WINDOWS_EXPORTER", "SNMP", "DOCKER", "PROXMOX", "CUSTOM"],
  listConfiguredMonitoringTargets: vi.fn().mockResolvedValue([]),
  getConfiguredMonitoringTarget: vi.fn().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 0, status: "NOT_CONFIGURED" }),
  getMonitoringObservation: vi.fn().mockResolvedValue({ target: { id: 7 }, backendStatus: "NOT_REQUIRED", targetStatus: "NOT_CONFIGURED", observedAt: null, metrics: null }),
  getMonitoringOverview: vi.fn().mockResolvedValue({ backendStatus: "AVAILABLE", counts: { UP: 0, DOWN: 0, UNKNOWN: 0, NOT_CONFIGURED: 0, CONFIGURED: 0 }, targets: [] }),
  createConfiguredMonitoringTarget: vi.fn().mockResolvedValue({ id: 7, status: "CONFIGURED" }),
  updateConfiguredMonitoringTarget: vi.fn().mockResolvedValue({ id: 7, status: "NOT_CONFIGURED" }),
  removeConfiguredMonitoringTarget: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("./services/monitoring", () => monitoringMock);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type Role = "admin" | "systems_network_admin" | "technician" | "it_manager" | "user";
function context(role?: Role): TrpcContext {
  return {
    user: role ? { id: 41, openId: `monitoring-${role}`, name: role, email: `${role}@example.test`, loginMethod: "test", role, status: "active", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), disabledAt: null } : undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}
const target = { assetId: 9, type: "NODE_EXPORTER" as const, endpoint: "node-exporter", port: 9100, enabled: true };

describe("monitoring router", () => {
  it("rejects anonymous overview access", async () => {
    await expect(appRouter.createCaller(context()).monitoring.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows technicians to read observed targets and details", async () => {
    const caller = appRouter.createCaller(context("technician"));
    await expect(caller.monitoring.targets.list()).resolves.toEqual([]);
    await expect(caller.monitoring.targets.status({ id: 7 })).resolves.toMatchObject({ targetStatus: "NOT_CONFIGURED" });
    expect(monitoringMock.getMonitoringObservation).toHaveBeenCalledWith(7);
  });

  it("allows an inventory manager to create, update and remove targets", async () => {
    const caller = appRouter.createCaller(context("it_manager"));
    await expect(caller.monitoring.targets.create(target)).resolves.toMatchObject({ id: 7 });
    await expect(caller.monitoring.targets.update({ id: 7, data: { enabled: false } })).resolves.toMatchObject({ id: 7 });
    await expect(caller.monitoring.targets.remove({ id: 7 })).resolves.toEqual({ success: true });
    expect(monitoringMock.createConfiguredMonitoringTarget).toHaveBeenCalledWith(41, target);
    expect(monitoringMock.updateConfiguredMonitoringTarget).toHaveBeenCalledWith(41, 7, { enabled: false, type: "NODE_EXPORTER", port: 9100 });
    expect(monitoringMock.removeConfiguredMonitoringTarget).toHaveBeenCalledWith(41, 7);
  });

  it("denies target mutations to a technician and a user", async () => {
    await expect(appRouter.createCaller(context("technician")).monitoring.targets.create(target)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("user")).monitoring.targets.remove({ id: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(monitoringMock.createConfiguredMonitoringTarget).toHaveBeenCalledTimes(1);
  });
});
