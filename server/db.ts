import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { assets, assetRelationships, auditLogs, Asset, InsertAsset, locations, networkInterfaces, roles, software, softwareInstallations, users, InsertUser } from "../drizzle/schema";
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
export async function listRelationships(assetId?: number) { const db = await getDb(); if (!db) return []; return db.select().from(assetRelationships).where(assetId ? or(eq(assetRelationships.sourceAssetId, assetId), eq(assetRelationships.destinationAssetId, assetId)) : undefined).orderBy(desc(assetRelationships.createdAt)); }
export async function createRelationship(input: typeof assetRelationships.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(assetRelationships).values(input); return db.select().from(assetRelationships).where(eq(assetRelationships.id, Number(result[0].insertId))).limit(1).then(rows => rows[0]); }
