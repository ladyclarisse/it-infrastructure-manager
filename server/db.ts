import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { alertRules, alerts, assets, assetRelationships, auditLogs, Asset, InsertAlertRule, InsertAsset, InsertIncident, incidentHistory, incidents, locations, networkDevices, networkInterfaces, roles, software, softwareInstallations, users, InsertUser, monitoringTargets } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const now = user.lastSignedIn ?? new Date();
  const values: InsertUser = { openId: user.openId, lastSignedIn: now };
  const updateSet: Record<string, unknown> = { lastSignedIn: now };
  for (const field of ["name", "email", "loginMethod"] as const) if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }
export async function getUserById(userId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.id, userId)).limit(1); return result[0]; }
export async function listUsers(search?: string) { const db = await getDb(); if (!db) return []; const pattern = search?.trim() ? `%${search.trim()}%` : undefined; return db.select().from(users).where(pattern ? or(like(users.name, pattern), like(users.email, pattern), like(users.openId, pattern)) : undefined).orderBy(desc(users.createdAt)); }
export async function getRoles() { const db = await getDb(); if (!db) return []; return db.select().from(roles).orderBy(roles.name); }
export async function updateUserAccess(userId: number, changes: { role?: string; status?: "active" | "disabled" }) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(users).set({ ...changes, disabledAt: changes.status === "disabled" ? new Date() : null }).where(eq(users.id, userId)); const result = await db.select().from(users).where(eq(users.id, userId)).limit(1); return result[0]; }
export async function createAuditLog(input: { actorUserId?: number; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown>; ipAddress?: string; userAgent?: string }) { const db = await getDb(); if (!db) return; await db.insert(auditLogs).values({ actorUserId: input.actorUserId, action: input.action, targetType: input.targetType, targetId: input.targetId, metadata: input.metadata ? JSON.stringify(input.metadata) : undefined, ipAddress: input.ipAddress, userAgent: input.userAgent }); }
export async function listAuditLogs(limit = 50) { const db = await getDb(); if (!db) return []; return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit); }

export type AssetFilters = { search?: string; assetType?: Asset["assetType"]; status?: Asset["status"]; environment?: Asset["environment"]; locationId?: number; page?: number; pageSize?: number };
export async function listAssets(filters: AssetFilters = {}) {
  const db = await getDb(); if (!db) return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 25 };
  const page = Math.max(1, filters.page ?? 1); const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const conditions = [];
  if (filters.assetType) conditions.push(eq(assets.assetType, filters.assetType));
  if (filters.status) conditions.push(eq(assets.status, filters.status));
  if (filters.environment) conditions.push(eq(assets.environment, filters.environment));
  if (filters.locationId) conditions.push(eq(assets.locationId, filters.locationId));
  if (filters.search?.trim()) { const p = `%${filters.search.trim()}%`; conditions.push(or(like(assets.hostname, p), like(assets.displayName, p), like(assets.assetTag, p), like(assets.serialNumber, p), like(assets.primaryIp, p), like(assets.manufacturer, p), like(assets.model, p))); }
  const where = conditions.length ? and(...conditions) : undefined;
  const [items, count] = await Promise.all([db.select().from(assets).where(where).orderBy(desc(assets.updatedAt)).limit(pageSize).offset((page - 1) * pageSize), db.select({ count: sql<number>`count(*)` }).from(assets).where(where)]);
  return { items, total: Number(count[0]?.count ?? 0), page, pageSize };
}
export async function getAssetById(id: number) { const db = await getDb(); if (!db) return undefined; const asset = (await db.select().from(assets).where(eq(assets.id, id)).limit(1))[0]; if (!asset) return undefined; const [interfaces, relations, installations, auditHistory] = await Promise.all([db.select().from(networkInterfaces).where(eq(networkInterfaces.assetId, id)), db.select().from(assetRelationships).where(or(eq(assetRelationships.sourceAssetId, id), eq(assetRelationships.destinationAssetId, id))), db.select().from(softwareInstallations).where(eq(softwareInstallations.assetId, id)), db.select().from(auditLogs).where(and(eq(auditLogs.targetType, "asset"), eq(auditLogs.targetId, String(id)))).orderBy(desc(auditLogs.createdAt)).limit(20)]); return { ...asset, interfaces, relations, installations, auditHistory }; }
export async function createAsset(input: InsertAsset) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(assets).values(input); const id = Number(result[0].insertId); return getAssetById(id); }
export async function updateAsset(id: number, input: Partial<InsertAsset>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(assets).set(input).where(eq(assets.id, id)); return getAssetById(id); }
export async function deleteAsset(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(assets).where(eq(assets.id, id)); return { success: true }; }
export async function listLocations() { const db = await getDb(); if (!db) return []; return db.select().from(locations).orderBy(locations.name); }
export async function listSoftware() { const db = await getDb(); if (!db) return []; return db.select().from(software).orderBy(software.name); }
export async function listNetworkInterfaces(assetId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(networkInterfaces).where(assetId ? eq(networkInterfaces.assetId, assetId) : undefined).orderBy(networkInterfaces.name); }
export async function getNetworkDeviceByAssetId(assetId: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(networkDevices).where(eq(networkDevices.assetId, assetId)).limit(1))[0]; }
export async function createNetworkDevice(input: typeof networkDevices.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(networkDevices).values(input); return getNetworkDeviceByAssetId(input.assetId); }
export async function updateNetworkDevice(assetId: number, input: Partial<typeof networkDevices.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(networkDevices).set(input).where(eq(networkDevices.assetId, assetId)); return getNetworkDeviceByAssetId(assetId); }
export async function deleteNetworkDevice(assetId: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(networkDevices).where(eq(networkDevices.assetId, assetId)); return { success: true }; }
export async function listRelationships(assetId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(assetRelationships).where(assetId ? or(eq(assetRelationships.sourceAssetId, assetId), eq(assetRelationships.destinationAssetId, assetId)) : undefined).orderBy(desc(assetRelationships.createdAt)); }
export async function createRelationship(input: typeof assetRelationships.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(assetRelationships).values(input); return db.select().from(assetRelationships).where(eq(assetRelationships.id, Number(result[0].insertId))).limit(1).then(rows => rows[0]); }

export async function getNetworkInterfaceById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(networkInterfaces).where(eq(networkInterfaces.id, id)).limit(1))[0]; }
export async function createNetworkInterface(input: typeof networkInterfaces.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(networkInterfaces).values(input); return getNetworkInterfaceById(Number(result[0].insertId)); }
export async function updateNetworkInterface(id: number, input: Partial<typeof networkInterfaces.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(networkInterfaces).set(input).where(eq(networkInterfaces.id, id)); return getNetworkInterfaceById(id); }
export async function deleteNetworkInterface(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(networkInterfaces).where(eq(networkInterfaces.id, id)); return { success: true }; }

export async function getSoftwareById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(software).where(eq(software.id, id)).limit(1))[0]; }
export async function createSoftware(input: typeof software.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(software).values(input); return getSoftwareById(Number(result[0].insertId)); }
export async function updateSoftware(id: number, input: Partial<typeof software.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(software).set(input).where(eq(software.id, id)); return getSoftwareById(id); }
export async function deleteSoftware(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(software).where(eq(software.id, id)); return { success: true }; }
export async function listSoftwareInstallations(assetId?: number, softwareId?: number) { const db = await getDb(); if (!db) return []; const conditions = []; if (assetId) conditions.push(eq(softwareInstallations.assetId, assetId)); if (softwareId) conditions.push(eq(softwareInstallations.softwareId, softwareId)); return db.select().from(softwareInstallations).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(softwareInstallations.updatedAt)); }
export async function getSoftwareInstallationById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(softwareInstallations).where(eq(softwareInstallations.id, id)).limit(1))[0]; }
export async function createSoftwareInstallation(input: typeof softwareInstallations.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(softwareInstallations).values(input); return getSoftwareInstallationById(Number(result[0].insertId)); }
export async function updateSoftwareInstallation(id: number, input: Partial<typeof softwareInstallations.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(softwareInstallations).set(input).where(eq(softwareInstallations.id, id)); return getSoftwareInstallationById(id); }
export async function deleteSoftwareInstallation(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(softwareInstallations).where(eq(softwareInstallations.id, id)); return { success: true }; }

export async function getLocationById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(locations).where(eq(locations.id, id)).limit(1))[0]; }
export async function createLocation(input: typeof locations.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(locations).values(input); return getLocationById(Number(result[0].insertId)); }
export async function updateLocation(id: number, input: Partial<typeof locations.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(locations).set(input).where(eq(locations.id, id)); return getLocationById(id); }
export async function deleteLocation(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(locations).where(eq(locations.id, id)); return { success: true }; }
export async function updateRelationship(id: number, input: Partial<typeof assetRelationships.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(assetRelationships).set(input).where(eq(assetRelationships.id, id)); return db.select().from(assetRelationships).where(eq(assetRelationships.id, id)).limit(1).then(rows => rows[0]); }
export async function deleteRelationship(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(assetRelationships).where(eq(assetRelationships.id, id)); return { success: true }; }

export async function listMonitoringTargets() { const db = await getDb(); if (!db) return []; return db.select().from(monitoringTargets).orderBy(desc(monitoringTargets.updatedAt)); }
export async function getMonitoringTargetById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(monitoringTargets).where(eq(monitoringTargets.id, id)).limit(1))[0]; }
export async function getMonitoringTargetByAssetId(assetId: number) { const db = await getDb(); if (!db) return []; return db.select().from(monitoringTargets).where(eq(monitoringTargets.assetId, assetId)).orderBy(desc(monitoringTargets.updatedAt)); }
export async function createMonitoringTarget(input: typeof monitoringTargets.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(monitoringTargets).values(input); return getMonitoringTargetById(Number(result[0].insertId)); }
export async function updateMonitoringTarget(id: number, input: Partial<typeof monitoringTargets.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(monitoringTargets).set(input).where(eq(monitoringTargets.id, id)); return getMonitoringTargetById(id); }
export async function deleteMonitoringTarget(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(monitoringTargets).where(eq(monitoringTargets.id, id)); return { success: true }; }

export async function listAlertRules() { const db = await getDb(); if (!db) return []; return db.select().from(alertRules).orderBy(desc(alertRules.updatedAt)); }
export async function getAlertRuleById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(alertRules).where(eq(alertRules.id, id)).limit(1))[0]; }
export async function getAlertRuleByName(name: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(alertRules).where(eq(alertRules.name, name)).limit(1))[0]; }
export async function createAlertRule(input: InsertAlertRule) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(alertRules).values(input); return getAlertRuleById(Number(result[0].insertId)); }
export async function updateAlertRule(id: number, input: Partial<InsertAlertRule>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(alertRules).set(input).where(eq(alertRules.id, id)); return getAlertRuleById(id); }
export async function deleteAlertRule(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(alertRules).where(eq(alertRules.id, id)); return { success: true }; }

export async function listAlerts(filters: { status?: typeof alerts.$inferSelect["status"]; severity?: typeof alerts.$inferSelect["severity"]; monitoringTargetId?: number } = {}) { const db = await getDb(); if (!db) return []; const conditions = []; if (filters.status) conditions.push(eq(alerts.status, filters.status)); if (filters.severity) conditions.push(eq(alerts.severity, filters.severity)); if (filters.monitoringTargetId) conditions.push(eq(alerts.monitoringTargetId, filters.monitoringTargetId)); return db.select().from(alerts).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(alerts.lastSeenAt)); }
export async function getAlertById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(alerts).where(eq(alerts.id, id)).limit(1))[0]; }
export async function getAlertByFingerprint(fingerprint: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(alerts).where(eq(alerts.fingerprint, fingerprint)).limit(1))[0]; }
export async function createAlert(input: typeof alerts.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(alerts).values(input); return getAlertById(Number(result[0].insertId)); }
export async function updateAlert(id: number, input: Partial<typeof alerts.$inferInsert>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(alerts).set(input).where(eq(alerts.id, id)); return getAlertById(id); }

export async function listIncidents(filters: { status?: typeof incidents.$inferSelect["status"]; severity?: typeof incidents.$inferSelect["severity"]; assignedToUserId?: number; monitoringTargetId?: number; createdFrom?: Date; createdTo?: Date } = {}) { const db = await getDb(); if (!db) return []; const conditions = []; if (filters.status) conditions.push(eq(incidents.status, filters.status)); if (filters.severity) conditions.push(eq(incidents.severity, filters.severity)); if (filters.assignedToUserId) conditions.push(eq(incidents.assignedToUserId, filters.assignedToUserId)); if (filters.monitoringTargetId) conditions.push(eq(incidents.monitoringTargetId, filters.monitoringTargetId)); if (filters.createdFrom) conditions.push(gte(incidents.createdAt, filters.createdFrom)); if (filters.createdTo) conditions.push(lte(incidents.createdAt, filters.createdTo)); return db.select().from(incidents).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(incidents.updatedAt)); }
export async function getIncidentById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(incidents).where(eq(incidents.id, id)).limit(1))[0]; }
export async function createIncident(input: InsertIncident) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(incidents).values(input); return getIncidentById(Number(result[0].insertId)); }
export async function updateIncident(id: number, input: Partial<InsertIncident>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(incidents).set(input).where(eq(incidents.id, id)); return getIncidentById(id); }
export async function listIncidentHistory(incidentId: number) { const db = await getDb(); if (!db) return []; return db.select().from(incidentHistory).where(eq(incidentHistory.incidentId, incidentId)).orderBy(incidentHistory.createdAt); }
export async function createIncidentHistory(input: typeof incidentHistory.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(incidentHistory).values(input); }
