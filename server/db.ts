import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditLogs, InsertUser, roles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: user.lastSignedIn ?? new Date() };
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function listUsers(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const pattern = search?.trim() ? `%${search.trim()}%` : undefined;
  return db
    .select()
    .from(users)
    .where(pattern ? or(like(users.name, pattern), like(users.email, pattern), like(users.openId, pattern)) : undefined)
    .orderBy(desc(users.createdAt));
}

export async function getRoles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roles).orderBy(roles.name);
}

export async function updateUserAccess(userId: number, changes: { role?: string; status?: "active" | "disabled" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set({ ...changes, disabledAt: changes.status === "disabled" ? new Date() : null }).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function createAuditLog(input: {
  actorUserId?: number;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

export async function listAuditLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
