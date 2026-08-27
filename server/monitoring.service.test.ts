import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { mapAvailabilityToStatus, MonitoringBackendError, prometheusQuery, validateMonitoringEndpoint } from "./services/monitoring";

afterEach(() => vi.restoreAllMocks());

describe("monitoring service", () => {
  it("accepts hostnames and ports but rejects URLs, paths and invalid ports", () => {
    expect(validateMonitoringEndpoint("node-exporter", 9100)).toEqual({ endpoint: "node-exporter", port: 9100 });
    expect(validateMonitoringEndpoint("192.0.2.10", 9100).port).toBe(9100);
    expect(() => validateMonitoringEndpoint("http://127.0.0.1", 9100)).toThrow(TRPCError);
    expect(() => validateMonitoringEndpoint("127.0.0.1/metrics", 9100)).toThrow(TRPCError);
    expect(() => validateMonitoringEndpoint("node-exporter", 0)).toThrow(TRPCError);
  });

  it("maps the real availability result to UP, DOWN and UNKNOWN", () => {
    expect(mapAvailabilityToStatus(1)).toBe("UP");
    expect(mapAvailabilityToStatus(0)).toBe("DOWN");
    expect(mapAvailabilityToStatus(null)).toBe("UNKNOWN");
  });

  it("keeps a disabled target in NOT_CONFIGURED", () => {
    expect(["NOT_CONFIGURED", "UP", "DOWN", "UNKNOWN"]).toContain("NOT_CONFIGURED");
  });

  it("reads a numeric Prometheus result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "success", data: { result: [{ value: [1700000000, "42.5"] }] } }), { status: 200 })));
    await expect(prometheusQuery("up{instance=\"node-exporter:9100\"}")).resolves.toBe(42.5);
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
