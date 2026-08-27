import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: string, userId = 10): TrpcContext {
  const now = new Date();
  return { user: { id: userId, openId: `test-${userId}`, name: "Test User", email: "test@example.com", loginMethod: "test", role, status: "active", createdAt: now, updatedAt: now, lastSignedIn: now, disabledAt: null } as any, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("RBAC identity procedures", () => {
  it("refuses anonymous access to user listing", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.users.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("allows the IT manager to access the user directory", async () => {
    const caller = appRouter.createCaller(context("it_manager"));
    await expect(caller.users.list({})).resolves.toBeInstanceOf(Array);
  });
  it("refuses the regular user from accessing the user directory", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.users.list({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("allows only the administrator to read audit records", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.audit.recent({ limit: 10 })).resolves.toBeInstanceOf(Array);
  });
  it("rejects self-disabling before any database mutation", async () => {
    const caller = appRouter.createCaller(context("admin", 10));
    await expect(caller.users.updateAccess({ userId: 10, status: "disabled" })).rejects.toThrow("cannot disable your own account");
  });
  it("rejects unknown role values at the API boundary", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.users.updateAccess({ userId: 999, role: "unknown" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
