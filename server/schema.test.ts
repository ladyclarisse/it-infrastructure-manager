import { describe, expect, it } from "vitest";
import { auditLogs, permissions, rolePermissions, roles, users } from "../drizzle/schema";

describe("identity schema", () => {
  it("exports the core identity, RBAC and audit tables", () => {
    expect(users).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(rolePermissions).toBeDefined();
    expect(auditLogs).toBeDefined();
  });
});
