import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const dbMock = vi.hoisted(() => ({
  getAlertRuleById: vi.fn(), getAlertRuleByName: vi.fn(), createAlertRule: vi.fn(), updateAlertRule: vi.fn(), deleteAlertRule: vi.fn(),
  getAlertById: vi.fn(), getAlertByFingerprint: vi.fn(), createAlert: vi.fn(), updateAlert: vi.fn(),
  createIncident: vi.fn(), getIncidentById: vi.fn(), updateIncident: vi.fn(), listIncidents: vi.fn(), listIncidentHistory: vi.fn(), createIncidentHistory: vi.fn(),
  getMonitoringTargetById: vi.fn(), getAssetById: vi.fn(), getUserById: vi.fn(), createAuditLog: vi.fn(), listAlertRules: vi.fn(), listAlerts: vi.fn(),
}));
vi.mock("./db", () => dbMock);

import { assertIncidentTransition, createConfiguredAlertRule, createManualIncident, evaluateAlertRule, fingerprintFor, getInitialAlertRuleDefinitions, syncAlertObservation, transitionIncident, validateAlertExpression } from "./services/alerting";

const rule = { id: 4, name: "Target down", description: "Target unavailable", expression: "up == 0", severity: "CRITICAL" as const, forDurationSeconds: 60, enabled: 1, labels: JSON.stringify({ source: "prometheus", create_incident: "true" }), annotations: JSON.stringify({ summary: "Target down" }), createdAt: new Date(), updatedAt: new Date() };
const alert = { id: 8, ruleId: 4, monitoringTargetId: 9, fingerprint: fingerprintFor(4, 9, { source: "prometheus" }), severity: "CRITICAL" as const, status: "FIRING" as const, summary: "Target down", description: "Target unavailable", startedAt: new Date(), resolvedAt: null, lastSeenAt: new Date(), labels: JSON.stringify({ source: "prometheus" }), annotations: rule.annotations, createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => {
  vi.restoreAllMocks();
  for (const mock of Object.values(dbMock)) mock.mockReset();
  dbMock.getAlertRuleById.mockResolvedValue(rule);
  dbMock.getAlertRuleByName.mockResolvedValue(undefined);
  dbMock.createAlertRule.mockResolvedValue({ ...rule, id: 5 });
  dbMock.updateAlertRule.mockResolvedValue(rule);
  dbMock.deleteAlertRule.mockResolvedValue({ success: true });
  dbMock.getAlertByFingerprint.mockResolvedValue(undefined);
  dbMock.createAlert.mockResolvedValue(alert);
  dbMock.updateAlert.mockResolvedValue(alert);
  dbMock.listIncidents.mockResolvedValue([]);
  dbMock.createIncident.mockResolvedValue({ id: 12, title: "Target down", severity: "CRITICAL", status: "OPEN", alertId: 8, monitoringTargetId: 9 });
  dbMock.getIncidentById.mockResolvedValue({ id: 12, title: "Manual", severity: "WARNING", status: "OPEN", monitoringTargetId: 9, assignedToUserId: null, createdAt: new Date(), updatedAt: new Date() });
  dbMock.getMonitoringTargetById.mockResolvedValue({ id: 9 });
  dbMock.getUserById.mockResolvedValue({ id: 41, status: "active" });
  dbMock.createAuditLog.mockResolvedValue(undefined);
  dbMock.createIncidentHistory.mockResolvedValue(undefined);
});

describe("alerting service", () => {
  it("validates controlled PromQL syntax and initial rules use Node Exporter metrics", () => {
    expect(validateAlertExpression("up == 0")).toBe("up == 0");
    expect(() => validateAlertExpression("up == 0; drop data")).toThrow(TRPCError);
    expect(() => validateAlertExpression("(up == 0")).toThrow(TRPCError);
    const definitions = getInitialAlertRuleDefinitions();
    expect(definitions).toHaveLength(4);
    expect(definitions.map(item => item.expression)).toEqual(expect.arrayContaining(["up == 0"]));
  });

  it("creates an alert rule with an audited mutation", async () => {
    await expect(createConfiguredAlertRule(41, { name: "Target down", expression: "up == 0", severity: "CRITICAL" })).resolves.toMatchObject({ id: 5 });
    expect(dbMock.createAlertRule).toHaveBeenCalledWith(expect.objectContaining({ name: "Target down", expression: "up == 0", severity: "CRITICAL", enabled: 1 }));
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 41, action: "ALERT_RULE_CREATED", targetType: "alert_rule" }));
  });

  it("produces a stable fingerprint independent of label order", () => {
    expect(fingerprintFor(4, 9, { b: "2", a: "1" })).toBe(fingerprintFor(4, 9, { a: "1", b: "2" }));
    expect(fingerprintFor(4, 9, { a: "1" })).not.toBe(fingerprintFor(4, 10, { a: "1" }));
  });

  it("evaluates a firing rule and deduplicates an existing alert", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ status: "success", data: { result: [{ value: [1700000000, "1"] }] } }), { status: 200 })));
    await expect(evaluateAlertRule(rule, 9, { source: "prometheus" })).resolves.toMatchObject({ status: "FIRING", backendStatus: "AVAILABLE" });
    dbMock.getAlertByFingerprint.mockResolvedValueOnce(alert);
    await expect(syncAlertObservation(41, 4, 9, { source: "prometheus" })).resolves.toMatchObject({ alert: alert, status: "FIRING" });
    expect(dbMock.createAlert).not.toHaveBeenCalled();
    expect(dbMock.updateAlert).toHaveBeenCalledWith(8, expect.objectContaining({ status: "FIRING" }));
  });

  it("creates one critical alert and one correlated incident when no fingerprint exists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ status: "success", data: { result: [{ value: [1700000000, "1"] }] } }), { status: 200 })));
    dbMock.getAlertByFingerprint.mockResolvedValue(undefined);
    await expect(syncAlertObservation(41, 4, 9, { source: "prometheus" })).resolves.toMatchObject({ status: "FIRING" });
    expect(dbMock.createAlert).toHaveBeenCalledTimes(1);
    expect(dbMock.createIncident).toHaveBeenCalledTimes(1);
    expect(dbMock.createIncidentHistory).toHaveBeenCalledWith(expect.objectContaining({ action: "INCIDENT_CREATED_FROM_ALERT", incidentId: 12 }));
  });

  it("distinguishes unavailable evaluation and blocks invalid incident transitions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Prometheus unavailable")));
    await expect(evaluateAlertRule(rule, 9)).resolves.toMatchObject({ status: "UNKNOWN", backendStatus: "UNAVAILABLE" });
    expect(() => assertIncidentTransition("CLOSED", "OPEN")).toThrow(TRPCError);
    expect(() => assertIncidentTransition("OPEN", "CLOSED")).toThrow(TRPCError);
  });

  it("creates a manual incident only for existing references and records its history", async () => {
    dbMock.getAlertById.mockResolvedValue({ ...alert, id: 8 });
    await expect(createManualIncident(41, { title: "Manual", severity: "WARNING", monitoringTargetId: 9, alertId: 8 })).resolves.toMatchObject({ id: 12 });
    expect(dbMock.createIncident).toHaveBeenCalledWith(expect.objectContaining({ title: "Manual", source: "MANUAL", status: "OPEN", monitoringTargetId: 9, alertId: 8 }));
    expect(dbMock.createIncidentHistory).toHaveBeenCalledWith(expect.objectContaining({ action: "INCIDENT_CREATED", toStatus: "OPEN" }));
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "INCIDENT_CREATED", targetType: "incident" }));
  });

  it("rejects missing monitoring targets and alerts before persistence", async () => {
    dbMock.getMonitoringTargetById.mockResolvedValue(undefined);
    await expect(createManualIncident(41, { title: "Invalid target", severity: "WARNING", monitoringTargetId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(syncAlertObservation(41, 4, 999)).rejects.toMatchObject({ code: "NOT_FOUND" });
    dbMock.getMonitoringTargetById.mockResolvedValue({ id: 9 });
    dbMock.getAlertById.mockResolvedValue(undefined);
    await expect(createManualIncident(41, { title: "Invalid alert", severity: "WARNING", monitoringTargetId: 9, alertId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.createIncident).not.toHaveBeenCalled();
  });
});
