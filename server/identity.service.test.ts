import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getRoles: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUserAccess: vi.fn(),
  createAuditLog: vi.fn(),
}));
vi.mock("./db", () => dbMock);

import { changeUserAccess } from "./services/identity";

describe("identity access hierarchy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks an IT manager from promoting a user to administrator", async () => {
    dbMock.getUserById.mockResolvedValue({ id: 22, role: "user" });
    await expect(changeUserAccess({ actorUserId: 10, actorRole: "it_manager", userId: 22, role: "admin" })).rejects.toThrow("Insufficient privileges");
    expect(dbMock.updateUserAccess).not.toHaveBeenCalled();
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "USER_ACCESS_DENIED" }));
  });

  it.each(["technician", "user"])("blocks %s from changing access", async actorRole => {
    dbMock.getUserById.mockResolvedValue({ id: 22, role: "user" });
    await expect(changeUserAccess({ actorUserId: 10, actorRole, userId: 22, role: "technician" })).rejects.toThrow("Insufficient privileges");
    expect(dbMock.updateUserAccess).not.toHaveBeenCalled();
  });

  it("blocks self-promotion and self-access changes", async () => {
    await expect(changeUserAccess({ actorUserId: 10, actorRole: "admin", userId: 10, role: "admin" })).rejects.toThrow("cannot modify your own access");
    expect(dbMock.getUserById).not.toHaveBeenCalled();
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "USER_ACCESS_DENIED" }));
  });

  it("allows an administrator to reactivate a lower-privileged user and records the audit", async () => {
    const updated = { id: 22, role: "user", status: "active", disabledAt: null };
    dbMock.getUserById.mockResolvedValue({ id: 22, role: "user", status: "disabled" });
    dbMock.updateUserAccess.mockResolvedValue(updated);
    await expect(changeUserAccess({ actorUserId: 1, actorRole: "admin", userId: 22, status: "active" })).resolves.toEqual(updated);
    expect(dbMock.updateUserAccess).toHaveBeenCalledWith(22, { role: undefined, status: "active" });
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "USER_ACCESS_UPDATED", targetId: "22", metadata: { role: undefined, status: "active" } }));
  });

  it("allows an administrator to change a lower-privileged user and records the audit", async () => {
    const updated = { id: 22, role: "technician", status: "active" };
    dbMock.getUserById.mockResolvedValue({ id: 22, role: "user" });
    dbMock.updateUserAccess.mockResolvedValue(updated);
    await expect(changeUserAccess({ actorUserId: 1, actorRole: "admin", userId: 22, role: "technician" })).resolves.toEqual(updated);
    expect(dbMock.updateUserAccess).toHaveBeenCalledWith(22, { role: "technician", status: undefined });
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "USER_ACCESS_UPDATED", targetId: "22" }));
  });
});
