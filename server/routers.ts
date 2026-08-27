import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, identityAdminProcedure, operationsProcedure, publicProcedure, roleProcedure, ROLE_SLUGS, router } from "./_core/trpc";
import { createAuditLog } from "./db";
import { changeUserAccess, listIdentityRoles, listIdentityUsers } from "./services/identity";
import { getRecentAudit, recordAuthEvent, ROLE_CATALOG } from "./services/access";
import { ASSET_STATUSES, ASSET_TYPES, ENVIRONMENTS, createInventoryAsset, createInventoryRelationship, inventoryOverview, readAsset, readAssets, readLocations, readNetworkInterfaces, readRelationships, readSoftware, removeInventoryAsset, updateInventoryAsset } from "./services/inventory";

const roleSchema = z.enum([ROLE_SLUGS.ADMIN, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN, ROLE_SLUGS.TECHNICIAN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.USER]);
const statusSchema = z.enum(["active", "disabled"]);
const assetTypeSchema = z.enum(ASSET_TYPES);
const assetStatusSchema = z.enum(ASSET_STATUSES);
const environmentSchema = z.enum(ENVIRONMENTS);
const assetFields = { assetTag: z.string().min(1).max(128), hostname: z.string().max(255).optional().nullable(), displayName: z.string().min(1).max(255), description: z.string().max(5000).optional().nullable(), serialNumber: z.string().max(255).optional().nullable(), assetType: assetTypeSchema, primaryIp: z.string().max(64).optional().nullable(), primaryMac: z.string().max(32).optional().nullable(), domain: z.string().max(255).optional().nullable(), fqdn: z.string().max(255).optional().nullable(), os: z.string().max(128).optional().nullable(), osDistribution: z.string().max(128).optional().nullable(), osVersion: z.string().max(128).optional().nullable(), architecture: z.string().max(64).optional().nullable(), kernelVersion: z.string().max(128).optional().nullable(), environment: environmentSchema, role: z.string().max(128).optional().nullable(), locationId: z.number().int().positive().optional().nullable(), status: assetStatusSchema, manufacturer: z.string().max(128).optional().nullable(), model: z.string().max(128).optional().nullable(), cpuCores: z.number().int().nonnegative().optional().nullable(), memoryMb: z.number().int().nonnegative().optional().nullable(), storageGb: z.number().int().nonnegative().optional().nullable(), notes: z.string().max(5000).optional().nullable() };
const createAssetSchema = z.object(assetFields);
const updateAssetSchema = z.object(assetFields).partial().refine(value => Object.keys(value).length > 0, "At least one field is required");
const listAssetSchema = z.object({ search: z.string().max(120).optional(), assetType: assetTypeSchema.optional(), status: assetStatusSchema.optional(), environment: environmentSchema.optional(), locationId: z.number().int().positive().optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(25) }).optional();
const inventoryManagerProcedure = roleProcedure(ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => { if (ctx.user) void recordAuthEvent(ctx.user.id, "AUTH_SESSION_CHECK", ctx.req); return ctx.user; }),
    logout: publicProcedure.mutation(({ ctx }) => { if (ctx.user) void recordAuthEvent(ctx.user.id, "AUTH_LOGOUT", ctx.req); const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  users: router({
    list: identityAdminProcedure.input(z.object({ search: z.string().max(120).optional() }).optional()).query(({ input }) => listIdentityUsers(input?.search)),
    roles: identityAdminProcedure.query(async () => listIdentityRoles().then(persisted => persisted.length ? persisted : ROLE_CATALOG)),
    updateAccess: identityAdminProcedure.input(z.object({ userId: z.number().int().positive(), role: roleSchema.optional(), status: statusSchema.optional() }).refine(value => value.role || value.status, "At least one access change is required")).mutation(({ ctx, input }) => changeUserAccess({ actorUserId: ctx.user.id, actorRole: ctx.user.role, userId: input.userId, role: input.role, status: input.status })),
  }),
  audit: router({ recent: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) })).query(({ input }) => getRecentAudit(input.limit)) }),
  infrastructure: router({
    overview: operationsProcedure.query(() => inventoryOverview()),
    assets: router({
      list: operationsProcedure.input(listAssetSchema).query(({ input }) => readAssets(input ?? {})),
      get: operationsProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => readAsset(input.id)),
      create: inventoryManagerProcedure.input(createAssetSchema).mutation(({ ctx, input }) => createInventoryAsset(ctx.user.id, input)),
      update: inventoryManagerProcedure.input(z.object({ id: z.number().int().positive(), data: updateAssetSchema })).mutation(({ ctx, input }) => updateInventoryAsset(ctx.user.id, input.id, input.data)),
      remove: inventoryManagerProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => removeInventoryAsset(ctx.user.id, input.id)),
    }),
    servers: router({ list: operationsProcedure.input(listAssetSchema).query(({ input }) => readAssets({ ...(input ?? {}), assetType: "server" })) }),
    workstations: router({ list: operationsProcedure.input(listAssetSchema).query(({ input }) => readAssets({ ...(input ?? {}), assetType: "workstation" })) }),
    networkDevices: router({ list: operationsProcedure.input(listAssetSchema).query(({ input }) => readAssets({ ...(input ?? {}), assetType: "network_device" })) }),
    locations: router({ list: operationsProcedure.query(() => readLocations()) }),
    networkInterfaces: router({ list: operationsProcedure.input(z.object({ assetId: z.number().int().positive().optional() }).optional()).query(({ input }) => readNetworkInterfaces(input?.assetId)) }),
    software: router({ list: operationsProcedure.query(() => readSoftware()) }),
    relationships: router({ list: operationsProcedure.input(z.object({ assetId: z.number().int().positive().optional() }).optional()).query(({ input }) => readRelationships(input?.assetId)), create: inventoryManagerProcedure.input(z.object({ sourceAssetId: z.number().int().positive(), destinationAssetId: z.number().int().positive(), relationshipType: z.string().min(1).max(64), sourceInterfaceId: z.number().int().positive().optional().nullable(), destinationInterfaceId: z.number().int().positive().optional().nullable(), description: z.string().max(5000).optional().nullable() })).mutation(({ ctx, input }) => createInventoryRelationship(ctx.user.id, input)) }),
  }),
});
export type AppRouter = typeof appRouter;
