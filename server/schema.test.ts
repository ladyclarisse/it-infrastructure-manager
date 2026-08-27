import { describe, expect, it } from "vitest";
import { assetRelationships, assets, auditLogs, locations, networkDevices, networkInterfaces, permissions, rolePermissions, roles, servers, software, softwareInstallations, users, workstations } from "../drizzle/schema";

describe("identity schema", () => {
  it("exports the core identity, RBAC and audit tables", () => {
    expect(users).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(rolePermissions).toBeDefined();
    expect(auditLogs).toBeDefined();
    expect(assets).toBeDefined();
    expect(servers).toBeDefined();
    expect(workstations).toBeDefined();
    expect(networkDevices).toBeDefined();
    expect(networkInterfaces).toBeDefined();
    expect(software).toBeDefined();
    expect(softwareInstallations).toBeDefined();
    expect(locations).toBeDefined();
    expect(assetRelationships).toBeDefined();
  });
});
