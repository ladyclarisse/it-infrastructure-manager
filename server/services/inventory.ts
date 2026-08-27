import { isIP } from "node:net";
import { TRPCError } from "@trpc/server";
import { createAsset, createAuditLog, createRelationship, deleteAsset, getAssetById, listAssets, listLocations, listNetworkInterfaces, listRelationships, listSoftware, updateAsset } from "../db";
import type { Asset, InsertAsset } from "../../drizzle/schema";

export const ASSET_TYPES = ["server", "workstation", "network_device"] as const;
export const ASSET_STATUSES = ["ACTIVE", "INACTIVE", "MAINTENANCE", "RETIRED", "UNKNOWN"] as const;
export const ENVIRONMENTS = ["PRODUCTION", "DEVELOPMENT", "TEST", "LAB", "OTHER"] as const;

function validateAssetInput(input: Partial<InsertAsset>) {
  if (input.primaryIp && !isIP(input.primaryIp)) throw new TRPCError({ code: "BAD_REQUEST", message: "primaryIp must be a valid IPv4 or IPv6 address" });
  if (input.cpuCores !== undefined && input.cpuCores !== null && input.cpuCores < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "cpuCores must be positive" });
  if (input.memoryMb !== undefined && input.memoryMb !== null && input.memoryMb < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "memoryMb must be positive" });
  if (input.storageGb !== undefined && input.storageGb !== null && input.storageGb < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "storageGb must be positive" });
}

async function audit(actorUserId: number, action: string, targetId: number, metadata?: Record<string, unknown>) {
  await createAuditLog({ actorUserId, action, targetType: "asset", targetId: String(targetId), metadata: { ...metadata, result: "success" } });
}

export async function inventoryOverview() {
  const [all, active, maintenance, softwareRows, locations] = await Promise.all([
    listAssets({ page: 1, pageSize: 100 }), listAssets({ status: "ACTIVE", page: 1, pageSize: 100 }), listAssets({ status: "MAINTENANCE", page: 1, pageSize: 100 }), listSoftware(), listLocations(),
  ]);
  return { totalAssets: all.total, servers: all.items.filter(item => item.assetType === "server").length, workstations: all.items.filter(item => item.assetType === "workstation").length, networkDevices: all.items.filter(item => item.assetType === "network_device").length, activeAssets: active.total, maintenanceAssets: maintenance.total, software: softwareRows.length, locations: locations.length };
}

export async function readAssets(filters: Parameters<typeof listAssets>[0]) { return listAssets(filters); }
export async function readAsset(id: number) { const result = await getAssetById(id); if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" }); return result; }
export async function createInventoryAsset(actorUserId: number, input: InsertAsset) { validateAssetInput(input); const result = await createAsset(input); if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Asset could not be created" }); await audit(actorUserId, "ASSET_CREATED", result.id, { assetType: result.assetType, environment: result.environment }); return result; }
export async function updateInventoryAsset(actorUserId: number, id: number, input: Partial<InsertAsset>) { validateAssetInput(input); const result = await updateAsset(id, input); if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" }); await audit(actorUserId, "ASSET_UPDATED", id, { fields: Object.keys(input) }); return result; }
export async function removeInventoryAsset(actorUserId: number, id: number) { await readAsset(id); await deleteAsset(id); await audit(actorUserId, "ASSET_DELETED", id); return { success: true }; }
export async function readLocations() { return listLocations(); }
export async function readSoftware() { return listSoftware(); }
export async function readNetworkInterfaces(assetId?: number) { return listNetworkInterfaces(assetId); }
export async function readRelationships(assetId?: number) { return listRelationships(assetId); }
export async function createInventoryRelationship(actorUserId: number, input: Parameters<typeof createRelationship>[0]) { if (input.sourceAssetId === input.destinationAssetId) throw new TRPCError({ code: "BAD_REQUEST", message: "An asset cannot relate to itself" }); const result = await createRelationship(input); if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Relationship could not be created" }); await audit(actorUserId, "ASSET_RELATIONSHIP_CREATED", result.id, { sourceAssetId: input.sourceAssetId, destinationAssetId: input.destinationAssetId, relationshipType: input.relationshipType }); return result; }

export function assetTypeFromPath(type: Asset["assetType"] | undefined) { return type; }
