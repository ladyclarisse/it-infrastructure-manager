import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  createAsset: vi.fn(), createAuditLog: vi.fn(), createRelationship: vi.fn(), deleteAsset: vi.fn(), getAssetById: vi.fn(), listAssets: vi.fn(), listLocations: vi.fn(), listRelationships: vi.fn(), listSoftware: vi.fn(), updateAsset: vi.fn(),
}));
vi.mock("./db", () => dbMock);

import { createInventoryAsset, createInventoryRelationship, readAsset } from "./services/inventory";

describe("inventory service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid primary IPs before persistence", async () => {
    await expect(createInventoryAsset(1, { assetTag: "LAB-01", displayName: "Lab 01", assetType: "server", environment: "LAB", status: "ACTIVE", primaryIp: "not-an-ip" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createAsset).not.toHaveBeenCalled();
  });

  it("creates an administrative asset and records the mutation", async () => {
    const created = { id: 7, assetTag: "LAB-SRV-01", displayName: "Lab server", assetType: "server", environment: "LAB", status: "ACTIVE" };
    dbMock.createAsset.mockResolvedValue(created);
    await expect(createInventoryAsset(1, { assetTag: "LAB-SRV-01", displayName: "Lab server", assetType: "server", environment: "LAB", status: "ACTIVE" })).resolves.toEqual(created);
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "ASSET_CREATED", targetType: "asset", targetId: "7" }));
  });

  it("returns NOT_FOUND for an unknown asset detail", async () => {
    dbMock.getAssetById.mockResolvedValue(undefined);
    await expect(readAsset(404)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a self relationship before persistence", async () => {
    await expect(createInventoryRelationship(1, { sourceAssetId: 3, destinationAssetId: 3, relationshipType: "CONNECTED_TO" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createRelationship).not.toHaveBeenCalled();
  });
});
