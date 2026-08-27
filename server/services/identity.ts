import { createAuditLog, getRoles, listUsers, updateUserAccess } from "../db";

export async function listIdentityUsers(search?: string) {
  return listUsers(search);
}

export async function listIdentityRoles() {
  return getRoles();
}

export async function changeUserAccess(input: { actorUserId: number; userId: number; role?: string; status?: "active" | "disabled" }) {
  if (input.actorUserId === input.userId && input.status === "disabled") throw new Error("You cannot disable your own account");
  const updated = await updateUserAccess(input.userId, { role: input.role, status: input.status });
  await createAuditLog({ actorUserId: input.actorUserId, action: "USER_ACCESS_UPDATED", targetType: "user", targetId: String(input.userId), metadata: { role: input.role, status: input.status } });
  return updated;
}
