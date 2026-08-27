import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const dbMock = vi.hoisted(() => ({
  getAssetById: vi.fn().mockResolvedValue({ id: 9, assetTag: "LAB-09" }),
  createMonitoringTarget: vi.fn().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 1, status: "CONFIGURED", labels: null }),
  getMonitoringTargetById: vi.fn().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 1, status: "CONFIGURED", labels: null }),
  updateMonitoringTarget: vi.fn().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 0, status: "NOT_CONFIGURED", labels: null }),
  deleteMonitoringTarget: vi.fn().mockResolvedValue({ success: true }),
  listMonitoringTargets: vi.fn().mockResolvedValue([]),
  createAuditLog: vi.fn().mockResolvedValue({ id: 1 }),
}));
vi.mock("./db", () => dbMock);

import { createConfiguredMonitoringTarget, getMonitoringObservation, mapAvailabilityToStatus, MonitoringBackendError, prometheusQuery, removeConfiguredMonitoringTarget, updateConfiguredMonitoringTarget, validateMonitoringEndpoint } from "./services/monitoring";

const target = { assetId: 9, type: "NODE_EXPORTER" as const, endpoint: "node-exporter", port: 9100, enabled: true };
beforeEach(() => {
  dbMock.getAssetById.mockReset().mockResolvedValue({ id: 9, assetTag: "LAB-09" });
  dbMock.createMonitoringTarget.mockReset().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 1, status: "CONFIGURED", labels: null });
  dbMock.getMonitoringTargetById.mockReset().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 1, status: "CONFIGURED", labels: null });
  dbMock.updateMonitoringTarget.mockReset().mockResolvedValue({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 0, status: "NOT_CONFIGURED", labels: null });
  dbMock.deleteMonitoringTarget.mockReset().mockResolvedValue({ success: true });
  dbMock.createAuditLog.mockReset().mockResolvedValue({ id: 1 });
});
afterEach(() => { vi.restoreAllMocks(); });

describe("monitoring service", () => {
  it("rejects unsafe endpoints and unsupported exporters", async () => {
    expect(() => validateMonitoringEndpoint("http://127.0.0.1", 9100)).toThrow(TRPCError);
    expect(() => validateMonitoringEndpoint("127.0.0.1/metrics", 9100)).toThrow(TRPCError);
    expect(() => validateMonitoringEndpoint("node-exporter", 0)).toThrow(TRPCError);
    await expect(createConfiguredMonitoringTarget(41, { ...target, type: "SNMP" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("maps real availability results to UP, DOWN and UNKNOWN", () => {
    expect(mapAvailabilityToStatus(1)).toBe("UP");
    expect(mapAvailabilityToStatus(0)).toBe("DOWN");
    expect(mapAvailabilityToStatus(null)).toBe("UNKNOWN");
  });

  it("creates, updates and removes targets with audit events", async () => {
    await expect(createConfiguredMonitoringTarget(41, target)).resolves.toMatchObject({ id: 7 });
    await expect(updateConfiguredMonitoringTarget(41, 7, { enabled: false })).resolves.toMatchObject({ id: 7 });
    await expect(removeConfiguredMonitoringTarget(41, 7)).resolves.toEqual({ success: true });
    expect(dbMock.updateMonitoringTarget).toHaveBeenCalledWith(7, expect.objectContaining({ enabled: 0, status: "NOT_CONFIGURED" }));
    expect(dbMock.createAuditLog).toHaveBeenNthCalledWith(1, expect.objectContaining({ actorUserId: 41, action: "MONITORING_TARGET_CREATED", targetType: "monitoring_target" }));
    expect(dbMock.createAuditLog).toHaveBeenNthCalledWith(2, expect.objectContaining({ action: "MONITORING_TARGET_UPDATED" }));
    expect(dbMock.createAuditLog).toHaveBeenNthCalledWith(3, expect.objectContaining({ action: "MONITORING_TARGET_DELETED" }));
  });

  it("rejects a target whose parent asset does not exist", async () => {
    dbMock.getAssetById.mockResolvedValueOnce(undefined);
    await expect(createConfiguredMonitoringTarget(41, target)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.createMonitoringTarget).not.toHaveBeenCalled();
    expect(dbMock.createAuditLog).not.toHaveBeenCalled();
  });

  it("keeps disabled targets NOT_CONFIGURED without querying Prometheus", async () => {
    dbMock.getMonitoringTargetById.mockResolvedValueOnce({ id: 7, assetId: 9, type: "NODE_EXPORTER", endpoint: "node-exporter", port: 9100, enabled: 0, status: "NOT_CONFIGURED", labels: null });
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(getMonitoringObservation(7)).resolves.toMatchObject({ backendStatus: "NOT_REQUIRED", targetStatus: "NOT_CONFIGURED", metrics: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads real observation metrics from Prometheus responses", async () => {
    const values = [1, 12.5, 33.2, 44.1, 1024, 512];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ status: "success", data: { result: [{ value: [1700000000, String(values.shift())] }] } }), { status: 200 })));
    await expect(getMonitoringObservation(7)).resolves.toMatchObject({ backendStatus: "AVAILABLE", targetStatus: "UP", metrics: { availability: 1, cpuPercent: 12.5, memoryPercent: 33.2, diskPercent: 44.1, networkReceiveBytesPerSecond: 1024, networkTransmitBytesPerSecond: 512 } });
  });

  it("distinguishes unavailable, invalid and empty Prometheus responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    await expect(prometheusQuery("up")).rejects.toBeInstanceOf(MonitoringBackendError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));
    await expect(prometheusQuery("up")).rejects.toBeInstanceOf(MonitoringBackendError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "success", data: { result: [] } }), { status: 200 })));
    await expect(prometheusQuery("up")).resolves.toBeNull();
  });
});
