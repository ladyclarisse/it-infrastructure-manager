import { isIP } from "node:net";
import { TRPCError } from "@trpc/server";
import { createAuditLog, createMonitoringTarget, deleteMonitoringTarget, getAssetById, getMonitoringTargetById, listMonitoringTargets, updateMonitoringTarget } from "../db";
import { ENV } from "../_core/env";
import type { InsertMonitoringTarget, MonitoringTarget } from "../../drizzle/schema";

export const MONITORING_TYPES = ["NODE_EXPORTER", "WINDOWS_EXPORTER", "SNMP", "DOCKER", "PROXMOX", "CUSTOM"] as const;
export const MONITORING_STATUSES = ["NOT_CONFIGURED", "CONFIGURED", "UP", "DOWN", "UNKNOWN"] as const;
export type MonitoringType = typeof MONITORING_TYPES[number];
export type MonitoringStatus = typeof MONITORING_STATUSES[number];
export type MonitoringTargetInput = { assetId: number; type?: MonitoringType; endpoint: string; port?: number; enabled?: boolean; labels?: Record<string, string> };
export function mapAvailabilityToStatus(up: number | null): MonitoringStatus { return up === 1 ? "UP" : up === 0 ? "DOWN" : "UNKNOWN"; }

export class MonitoringBackendError extends Error {
  constructor(message = "Monitoring backend unavailable") { super(message); this.name = "MonitoringBackendError"; }
}

function fail(message: string): never { throw new TRPCError({ code: "BAD_REQUEST", message }); }
function ensureId(value: number) { if (!Number.isInteger(value) || value < 1) fail("Invalid monitoring target id"); return value; }

export function validateMonitoringEndpoint(endpoint: string, port: number) {
  if (!endpoint || endpoint.length > 255 || endpoint.includes("://") || /[\s/?#]/.test(endpoint)) fail("Endpoint must be a hostname or IP address without a scheme or path");
  const validHostname = /^[a-zA-Z0-9](?:[a-zA-Z0-9_.-]*[a-zA-Z0-9])?$/.test(endpoint);
  if (!validHostname && !isIP(endpoint)) fail("Endpoint hostname or IP address is invalid");
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail("Monitoring port must be between 1 and 65535");
  return { endpoint, port };
}

function inputToInsert(input: MonitoringTargetInput): InsertMonitoringTarget {
  const type = input.type ?? "NODE_EXPORTER";
  if (type !== "NODE_EXPORTER") fail(`${type} monitoring is PLANNED; only NODE_EXPORTER is implemented`);
  const port = input.port ?? 9100;
  validateMonitoringEndpoint(input.endpoint, port);
  if (!Number.isInteger(input.assetId) || input.assetId < 1) fail("Asset reference is invalid");
  return { assetId: input.assetId, type, endpoint: input.endpoint, port, enabled: input.enabled ? 1 : 0, status: input.enabled ? "CONFIGURED" : "NOT_CONFIGURED", labels: input.labels ? JSON.stringify(input.labels) : null };
}

async function audit(actorUserId: number, action: string, targetId: number, metadata: Record<string, unknown>) {
  await createAuditLog({ actorUserId, action, targetType: "monitoring_target", targetId: String(targetId), metadata });
}

export async function listConfiguredMonitoringTargets() { return listMonitoringTargets(); }
export async function getConfiguredMonitoringTarget(id: number) { const target = await getMonitoringTargetById(ensureId(id)); if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Monitoring target not found" }); return target; }

export async function createConfiguredMonitoringTarget(actorUserId: number, input: MonitoringTargetInput) {
  const values = inputToInsert(input);
  if (!(await getAssetById(values.assetId))) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
  const target = await createMonitoringTarget(values);
  if (!target) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Monitoring target could not be created" });
  await audit(actorUserId, "MONITORING_TARGET_CREATED", target.id, { type: target.type, endpoint: target.endpoint, port: target.port, enabled: target.enabled === 1 });
  return target;
}

export async function updateConfiguredMonitoringTarget(actorUserId: number, id: number, input: Partial<MonitoringTargetInput>) {
  const existing = await getConfiguredMonitoringTarget(id);
  const nextEndpoint = input.endpoint ?? existing.endpoint;
  const nextPort = input.port ?? existing.port;
  const nextType = input.type ?? existing.type;
  if (nextType !== "NODE_EXPORTER") fail(`${nextType} monitoring is PLANNED; only NODE_EXPORTER is implemented`);
  validateMonitoringEndpoint(nextEndpoint, nextPort);
  if (input.assetId !== undefined && input.assetId !== existing.assetId) {
    if (!(await getAssetById(input.assetId))) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
  }
  const enabled = input.enabled ?? existing.enabled === 1;
  const target = await updateMonitoringTarget(id, { assetId: input.assetId ?? existing.assetId, type: "NODE_EXPORTER", endpoint: nextEndpoint, port: nextPort, enabled: enabled ? 1 : 0, status: enabled ? "CONFIGURED" : "NOT_CONFIGURED", labels: input.labels ? JSON.stringify(input.labels) : existing.labels });
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Monitoring target not found" });
  await audit(actorUserId, "MONITORING_TARGET_UPDATED", id, { type: target.type, endpoint: target.endpoint, port: target.port, enabled });
  return target;
}

export async function removeConfiguredMonitoringTarget(actorUserId: number, id: number) {
  await getConfiguredMonitoringTarget(id);
  const result = await deleteMonitoringTarget(id);
  await audit(actorUserId, "MONITORING_TARGET_DELETED", id, { success: true });
  return result;
}

function promLabel(value: string) { return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n"); }
function targetInstance(target: MonitoringTarget) { return `${target.endpoint}:${target.port}`; }

export async function prometheusQuery(query: string): Promise<number | null> {
  if (!ENV.monitoringEnabled) throw new MonitoringBackendError("Monitoring disabled");
  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENV.prometheusTimeoutMs);
    response = await fetch(`${ENV.prometheusUrl.replace(/\/$/, "")}/api/v1/query?query=${encodeURIComponent(query)}`, { signal: controller.signal, headers: { accept: "application/json" } }).finally(() => clearTimeout(timeout));
  } catch (error) {
    console.warn("[Monitoring] Prometheus request failed", error instanceof Error ? error.message : "unknown error");
    throw new MonitoringBackendError();
  }
  if (!response.ok) { console.warn("[Monitoring] Prometheus returned HTTP", response.status); throw new MonitoringBackendError(); }
  let payload: { status?: string; data?: { result?: Array<{ value?: [number, string] }> } };
  try { payload = await response.json() as typeof payload; } catch { throw new MonitoringBackendError("Monitoring backend returned invalid JSON"); }
  if (payload.status !== "success") throw new MonitoringBackendError("Monitoring backend returned an error");
  const value = payload.data?.result?.[0]?.value?.[1];
  const numberValue = value === undefined ? null : Number(value);
  return numberValue !== null && Number.isFinite(numberValue) ? numberValue : null;
}

export async function getMonitoringOverview() {
  const targets = await listConfiguredMonitoringTargets();
  const observations = await Promise.all(targets.map(async target => {
    if (!target.enabled) return { id: target.id, targetStatus: "NOT_CONFIGURED" as const, backendStatus: "NOT_REQUIRED" as const };
    try {
      const up = await prometheusQuery(`up{instance="${promLabel(targetInstance(target))}"}`);
      return { id: target.id, targetStatus: mapAvailabilityToStatus(up), backendStatus: "AVAILABLE" as const };
    } catch (error) {
      if (error instanceof MonitoringBackendError) return { id: target.id, targetStatus: "UNKNOWN" as const, backendStatus: "UNAVAILABLE" as const };
      throw error;
    }
  }));
  const counts: Record<MonitoringStatus, number> = { UP: 0, DOWN: 0, UNKNOWN: 0, NOT_CONFIGURED: 0, CONFIGURED: 0 };
  observations.forEach(observation => { counts[observation.targetStatus] += 1; });
  return { backendStatus: observations.some(observation => observation.backendStatus === "UNAVAILABLE") ? "UNAVAILABLE" as const : "AVAILABLE" as const, counts, targets: targets.map(target => ({ ...target, liveStatus: observations.find(observation => observation.id === target.id)?.targetStatus ?? "UNKNOWN" })) };
}

export async function getMonitoringObservation(id: number) {
  const target = await getConfiguredMonitoringTarget(id);
  if (!target.enabled) return { backendStatus: "NOT_REQUIRED" as const, targetStatus: "NOT_CONFIGURED" as const, target, observedAt: null, metrics: null };
  const instance = promLabel(targetInstance(target));
  try {
    const up = await prometheusQuery(`up{instance="${instance}"}`);
    const targetStatus = mapAvailabilityToStatus(up);
    return { backendStatus: "AVAILABLE" as const, targetStatus, target, observedAt: new Date().toISOString(), metrics: { availability: up, cpuPercent: await prometheusQuery(`100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle",instance="${instance}"}[5m])) * 100)`), memoryPercent: await prometheusQuery(`(1 - (node_memory_MemAvailable_bytes{instance="${instance}"} / node_memory_MemTotal_bytes{instance="${instance}"})) * 100`), diskPercent: await prometheusQuery(`(1 - (sum(node_filesystem_avail_bytes{instance="${instance}",fstype!~"tmpfs|overlay"}) / sum(node_filesystem_size_bytes{instance="${instance}",fstype!~"tmpfs|overlay"}))) * 100`), networkReceiveBytesPerSecond: await prometheusQuery(`sum(rate(node_network_receive_bytes_total{instance="${instance}",device!="lo"}[5m]))`), networkTransmitBytesPerSecond: await prometheusQuery(`sum(rate(node_network_transmit_bytes_total{instance="${instance}",device!="lo"}[5m]))`) } };
  } catch (error) {
    if (error instanceof MonitoringBackendError) return { backendStatus: "UNAVAILABLE" as const, targetStatus: "UNKNOWN" as const, target, observedAt: null, metrics: null, error: "Monitoring backend unavailable" };
    throw error;
  }
}
