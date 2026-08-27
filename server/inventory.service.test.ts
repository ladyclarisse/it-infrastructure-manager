import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  createAsset: vi.fn(), createAuditLog: vi.fn(), createLocation: vi.fn(), createNetworkInterface: vi.fn(), createRelationship: vi.fn(), createSoftware: vi.fn(), createSoftwareInstallation: vi.fn(),
  deleteAsset: vi.fn(), deleteLocation: vi.fn(), deleteNetworkInterface: vi.fn(), deleteRelationship: vi.fn(), deleteSoftware: vi.fn(), deleteSoftwareInstallation: vi.fn(),
  getAssetById: vi.fn(), getLocationById: vi.fn(), getNetworkInterfaceById: vi.fn(), getSoftwareById: vi.fn(), getSoftwareInstallationById: vi.fn(), listAssets: vi.fn(), listLocations: vi.fn(), listNetworkInterfaces: vi.fn(), listRelationships: vi.fn(), listSoftware: vi.fn(), listSoftwareInstallations: vi.fn(), updateAsset: vi.fn(), updateLocation: vi.fn(), updateNetworkInterface: vi.fn(), updateRelationship: vi.fn(), updateSoftware: vi.fn(), updateSoftwareInstallation: vi.fn(),
}));
vi.mock("./db", () => dbMock);

import { createInventoryAsset, createInventoryInstallation, createInventoryInterface, createInventoryLocation, createInventoryRelationship, createInventorySoftware, readAsset, removeInventoryInterface, updateInventoryLocation } from "./services/inventory";

const asset = { id: 3, assetTag: "LAB-03", displayName: "Lab 03", assetType: "server", environment: "LAB", status: "ACTIVE" };

describe("inventory service", () => {
  beforeEach(() => vi.resetAllMocks());

  it("rejects invalid primary IPs before persistence", async () => {
    await expect(createInventoryAsset(1, { assetTag: "LAB-01", displayName: "Lab 01", assetType: "server", environment: "LAB", status: "ACTIVE", primaryIp: "not-an-ip" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createAsset).not.toHaveBeenCalled();
  });

  it("creates an administrative asset and records the mutation", async () => {
    const created = { id: 7, assetTag: "LAB-SRV-01", displayName: "Lab server", assetType: "server", environment: "LAB", status: "ACTIVE" };
    dbMock.createAsset.mockResolvedValue(created);
    await expect(createInventoryAsset(1, { assetTag: "LAB-SRV-01", displayName: "Lab server", assetType: "server", environment: "LAB", status: "ACTIVE" })).resolves.toEqual(created);
    expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "ASSET_CREATED", targetType: "asset", targetId: "7", metadata: expect.objectContaining({ result: "success" }) }));
  });

  it("returns NOT_FOUND for an unknown asset detail", async () => { dbMock.getAssetById.mockResolvedValue(undefined); await expect(readAsset(404)).rejects.toMatchObject({ code: "NOT_FOUND" }); });

  it("rejects a self relationship before persistence", async () => { await expect(createInventoryRelationship(1, { sourceAssetId: 3, destinationAssetId: 3, relationshipType: "CONNECTED_TO" })).rejects.toMatchObject({ code: "BAD_REQUEST" }); expect(dbMock.createRelationship).not.toHaveBeenCalled(); });

  it("rejects invalid MAC addresses before creating an interface", async () => { await expect(createInventoryInterface(1, { assetId: 3, name: "eth0", macAddress: "bad-mac" })).rejects.toMatchObject({ code: "BAD_REQUEST" }); expect(dbMock.createNetworkInterface).not.toHaveBeenCalled(); });

  it("requires an existing parent asset and audits interface creation", async () => { dbMock.getAssetById.mockResolvedValue(asset); const created = { id: 11, assetId: 3, name: "eth0", macAddress: "AA:BB:CC:DD:EE:FF" }; dbMock.createNetworkInterface.mockResolvedValue(created); await expect(createInventoryInterface(1, { assetId: 3, name: "eth0", macAddress: "AA:BB:CC:DD:EE:FF" })).resolves.toEqual(created); expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "NETWORK_INTERFACE_CREATED", targetType: "network_interface", targetId: "11" })); });

  it("rejects an interface attached to an unknown asset", async () => { dbMock.getAssetById.mockResolvedValue(undefined); await expect(createInventoryInterface(1, { assetId: 404, name: "eth0" })).rejects.toMatchObject({ code: "NOT_FOUND" }); expect(dbMock.createNetworkInterface).not.toHaveBeenCalled(); });

  it("creates software and audits the catalog mutation", async () => { const created = { id: 5, name: "Nginx", version: "1.25" }; dbMock.createSoftware.mockResolvedValue(created); await expect(createInventorySoftware(1, { name: "Nginx", version: "1.25" })).resolves.toEqual(created); expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOFTWARE_CREATED", targetType: "software", targetId: "5" })); });

  it("requires both asset and software for an installation", async () => { dbMock.getAssetById.mockResolvedValue(asset); dbMock.getSoftwareById.mockResolvedValue(undefined); await expect(createInventoryInstallation(1, { assetId: 3, softwareId: 404, status: "ACTIVE" })).rejects.toMatchObject({ code: "NOT_FOUND" }); expect(dbMock.createSoftwareInstallation).not.toHaveBeenCalled(); });

  it("validates location references and audits location updates", async () => { const location = { id: 2, name: "Paris", kind: "site" }; dbMock.getLocationById.mockResolvedValue(location); dbMock.updateLocation.mockResolvedValue({ ...location, name: "Paris HQ" }); await expect(updateInventoryLocation(1, 2, { name: "Paris HQ" })).resolves.toMatchObject({ name: "Paris HQ" }); expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "LOCATION_UPDATED", targetType: "location", targetId: "2" })); });

  it("audits interface deletion after checking existence", async () => { dbMock.getNetworkInterfaceById.mockResolvedValue({ id: 11, assetId: 3, name: "eth0" }); dbMock.deleteNetworkInterface.mockResolvedValue({ success: true }); await expect(removeInventoryInterface(1, 11)).resolves.toEqual({ success: true }); expect(dbMock.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "NETWORK_INTERFACE_DELETED", targetType: "network_interface", targetId: "11" })); });
});
