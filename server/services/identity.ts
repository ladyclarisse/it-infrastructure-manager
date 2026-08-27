import { createAuditLog, getRoles, getUserById, listUsers, updateUserAccess } from "../db";

const ROLE_LEVEL: Record<string, number> = {
  user: 10,
  technician: 30,
  systems_network_admin: 50,
  it_manager: 70,
  admin: 100,
};

function canManageTarget(actorRole: string, targetRole: string, requestedRole?: string) {
  const actorLevel = ROLE_LEVEL[actorRole] ?? -1;
  const targetLevel = ROLE_LEVEL[targetRole] ?? Number.MAX_SAFE_INTEGER;
  const requestedLevel = requestedRole ? ROLE_LEVEL[requestedRole] ?? Number.MAX_SAFE_INTEGER : targetLevel;
  return actorRole === "admin" || (actorLevel >= targetLevel && actorLevel >= requestedLevel && requestedRole !== "admin");
}

async function recordAccessAttempt(input: { actorUserId: number; userId: number; action: string; metadata?: Record<string, unknown> }) {
  try {
    await createAuditLog({ actorUserId: input.actorUserId, action: input.action, targetType: "user", targetId: String(input.userId), metadata: input.metadata });
  } catch (error) {
    console.warn("[Audit] Could not record access attempt:", error instanceof Error ? error.message : String(error));
  }
}

export async function listIdentityUsers(search?: string) { return listUsers(search); }
export async function listIdentityRoles() { return getRoles(); }

export async function changeUserAccess(input: { actorUserId: number; actorRole: string; userId: number; role?: string; status?: "active" | "disabled" }) {
  if (!["admin", "it_manager"].includes(input.actorRole)) {
    await recordAccessAttempt({ actorUserId: input.actorUserId, userId: input.userId, action: "USER_ACCESS_DENIED", metadata: { reason: "role-not-authorized" } });
    throw new Error("Insufficient privileges for this access change");
  }
  if (input.actorUserId === input.userId) {
    await recordAccessAttempt({ actorUserId: input.actorUserId, userId: input.userId, action: "USER_ACCESS_DENIED", metadata: { reason: "self-modification" } });
    throw new Error("You cannot modify your own access");
  }
  const target = await getUserById(input.userId);
  if (!target) throw new Error("User not found");
  if (!canManageTarget(input.actorRole, target.role, input.role)) {
    await recordAccessAttempt({ actorUserId: input.actorUserId, userId: input.userId, action: "USER_ACCESS_DENIED", metadata: { reason: "insufficient-hierarchy", requestedRole: input.role } });
    throw new Error("Insufficient privileges for this access change");
  }
  const updated = await updateUserAccess(input.userId, { role: input.role, status: input.status });
  await recordAccessAttempt({ actorUserId: input.actorUserId, userId: input.userId, action: "USER_ACCESS_UPDATED", metadata: { role: input.role, status: input.status } });
  return updated;
}
