import { describe, expect, it, vi } from "vitest";

const inventoryMock = vi.hoisted(() => ({
  ASSET_STATUSES: ["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED", "UNKNOWN"],
  ASSET_TYPES: ["server", "workstation", "network_device"],
  ENVIRONMENTS: ["PRODUCTION", "DEVELOPMENT", "TEST", "LAB", "OTHER"],
  inventoryOverview: vi.fn().mockResolvedValue({ totalAssets: 0, servers: 0, workstations: 0, networkDevices: 0, activeAssets: 0, maintenanceAssets: 0, software: 0, locations: 0 }),
  readAssets: vi.fn().mockImplementation((filters: any) => Promise.resolve({ items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 25 })),
  readAsset: vi.fn().mockResolvedValue({ id: 9, assetTag: "LAB-09" }),
  createInventoryAsset: vi.fn().mockResolvedValue({ id: 9, assetTag: "LAB-09" }),
  updateInventoryAsset: vi.fn().mockResolvedValue({ id: 9 }),
  removeInventoryAsset: vi.fn().mockResolvedValue({ success: true }),
  readLocations: vi.fn().mockResolvedValue([]),
  readNetworkInterfaces: vi.fn().mockResolvedValue([]),
  readRelationships: vi.fn().mockResolvedValue([]),
  readSoftware: vi.fn().mockResolvedValue([]),
  createInventoryRelationship: vi.fn().mockResolvedValue({ id: 2 }),
}));
vi.mock("./services/inventory", () => inventoryMock);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type Role = "admin" | "systems_network_admin" | "technician" | "it_manager" | "user";
function context(role?: Role): TrpcContext { return { user: role ? { id: 41, openId: `router-${role}`, name: role, email: `${role}@example.test`, loginMethod: "test", role, status: "active", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), disabledAt: null } : undefined, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] }; }
const asset = { assetTag: "LAB-01", displayName: "Lab asset", assetType: "server" as const, environment: "LAB" as const, status: "ACTIVE" as const };

describe("infrastructure router", () => {
  it("rejects anonymous collection access", async () => { await expect(appRouter.createCaller(context()).infrastructure.assets.list({ page: 1, pageSize: 10 })).rejects.toMatchObject({ code: "UNAUTHORIZED" }); });
  it("allows a technician to read filtered collections", async () => { await expect(appRouter.createCaller(context("technician")).infrastructure.assets.list({ search: "lab", assetType: "server", environment: "LAB", page: 2, pageSize: 10 })).resolves.toMatchObject({ page: 2, pageSize: 10 }); expect(inventoryMock.readAssets).toHaveBeenCalledWith(expect.objectContaining({ search: "lab", assetType: "server", environment: "LAB", page: 2 })); });
  it("allows an inventory manager to retrieve details and create an asset", async () => { const caller = appRouter.createCaller(context("it_manager")); await expect(caller.infrastructure.assets.get({ id: 9 })).resolves.toMatchObject({ id: 9 }); await expect(caller.infrastructure.assets.create(asset)).resolves.toMatchObject({ id: 9 }); expect(inventoryMock.createInventoryAsset).toHaveBeenCalledWith(41, asset); });
  it("allows an inventory manager to remove an asset", async () => { await expect(appRouter.createCaller(context("systems_network_admin")).infrastructure.assets.remove({ id: 9 })).resolves.toEqual({ success: true }); expect(inventoryMock.removeInventoryAsset).toHaveBeenCalledWith(41, 9); });
  it("rejects user-level asset creation before reaching the service", async () => { await expect(appRouter.createCaller(context("user")).infrastructure.assets.create(asset)).rejects.toMatchObject({ code: "FORBIDDEN" }); });
  it("allows operations roles to read specialized collections", async () => { await expect(appRouter.createCaller(context("systems_network_admin")).infrastructure.networkInterfaces.list()).resolves.toBeInstanceOf(Array); });
});
