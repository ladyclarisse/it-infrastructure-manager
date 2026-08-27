import type { Express, Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { createContext } from "../_core/context";
import { ROLE_SLUGS } from "../_core/trpc";
import {
  createInventoryAsset, createInventoryInstallation, createInventoryInterface, createInventoryLocation, createInventoryNetworkDevice, createInventoryRelationship, createInventorySoftware,
  inventoryOverview, readAsset, readAssets, readInstallation, readInstallations, readLocation, readLocations, readNetworkDevice, readNetworkInterface, readNetworkInterfaces, readRelationships, readSoftware, readSoftwareItem,
  removeInventoryAsset, removeInventoryInstallation, removeInventoryInterface, removeInventoryLocation, removeInventoryNetworkDevice, removeInventoryRelationship, removeInventorySoftware,
  updateInventoryAsset, updateInventoryInstallation, updateInventoryInterface, updateInventoryLocation, updateInventoryNetworkDevice, updateInventoryRelationship, updateInventorySoftware,
} from "../services/inventory";

const writeRoles = new Set<string>([ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN]);
const resourceErrorStatus: Record<string, number> = { UNAUTHORIZED: 401, FORBIDDEN: 403, BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409, INTERNAL_SERVER_ERROR: 500 };

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;

export function httpError(error: unknown) {
  const code = error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = error instanceof Error ? error.message : "Internal server error";
  return { status: resourceErrorStatus[code] ?? 500, body: { error: { code, message } } };
}

async function withIdentity(req: Request, res: Response, write: boolean, handler: (user: NonNullable<Awaited<ReturnType<typeof createContext>>["user"]>) => Promise<unknown>) {
  const context = await createContext({ req, res } as Parameters<typeof createContext>[0]);
  if (!context.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  if (write && !writeRoles.has(context.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Inventory write permission required" });
  try { return await handler(context.user); } catch (error) { throw error; }
}

function respond(handler: AsyncHandler): AsyncHandler { return async (req, res) => { try { res.status(200).json(await handler(req, res)); } catch (error) { const mapped = httpError(error); res.status(mapped.status).json(mapped.body); } }; }
function assetId(req: Request, key = "id") { const id = Number(req.params[key]); if (!Number.isInteger(id) || id < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid resource id" }); return id; }
function payload(req: Request) { return req.body && typeof req.body === "object" ? req.body : {}; }

export function registerInventoryRestRoutes(app: Express) {
  app.get("/api/overview", respond((req, res) => withIdentity(req, res, false, () => inventoryOverview())));
  app.get("/api/assets", respond((req, res) => withIdentity(req, res, false, () => readAssets({ search: typeof req.query.search === "string" ? req.query.search : undefined, assetType: typeof req.query.assetType === "string" ? req.query.assetType as never : undefined, status: typeof req.query.status === "string" ? req.query.status as never : undefined, environment: typeof req.query.environment === "string" ? req.query.environment as never : undefined, locationId: req.query.locationId ? Number(req.query.locationId) : undefined, page: req.query.page ? Number(req.query.page) : 1, pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25 }))));
  app.get("/api/assets/:id", respond((req, res) => withIdentity(req, res, false, () => readAsset(assetId(req)))));
  app.post("/api/assets", respond((req, res) => withIdentity(req, res, true, user => createInventoryAsset(user.id, payload(req) as never))));
  app.patch("/api/assets/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventoryAsset(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/assets/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventoryAsset(user.id, assetId(req)))));

  app.get("/api/network-devices/:assetId", respond((req, res) => withIdentity(req, res, false, () => readNetworkDevice(assetId(req, "assetId")))));
  app.post("/api/network-devices", respond((req, res) => withIdentity(req, res, true, user => createInventoryNetworkDevice(user.id, payload(req) as never))));
  app.patch("/api/network-devices/:assetId", respond((req, res) => withIdentity(req, res, true, user => updateInventoryNetworkDevice(user.id, Number(req.params.assetId), payload(req) as never))));
  app.delete("/api/network-devices/:assetId", respond((req, res) => withIdentity(req, res, true, user => removeInventoryNetworkDevice(user.id, assetId(req, "assetId")))));

  app.get("/api/network-interfaces", respond((req, res) => withIdentity(req, res, false, () => readNetworkInterfaces(req.query.assetId ? Number(req.query.assetId) : undefined))));
  app.get("/api/network-interfaces/:id", respond((req, res) => withIdentity(req, res, false, () => readNetworkInterface(assetId(req)))));
  app.post("/api/network-interfaces", respond((req, res) => withIdentity(req, res, true, user => createInventoryInterface(user.id, payload(req) as never))));
  app.patch("/api/network-interfaces/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventoryInterface(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/network-interfaces/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventoryInterface(user.id, assetId(req)))));

  app.get("/api/software", respond((req, res) => withIdentity(req, res, false, () => readSoftware())));
  app.get("/api/software/:id", respond((req, res) => withIdentity(req, res, false, () => readSoftwareItem(assetId(req)))));
  app.post("/api/software", respond((req, res) => withIdentity(req, res, true, user => createInventorySoftware(user.id, payload(req) as never))));
  app.patch("/api/software/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventorySoftware(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/software/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventorySoftware(user.id, assetId(req)))));

  app.get("/api/software-installations", respond((req, res) => withIdentity(req, res, false, () => readInstallations(req.query.assetId ? Number(req.query.assetId) : undefined, req.query.softwareId ? Number(req.query.softwareId) : undefined))));
  app.get("/api/software-installations/:id", respond((req, res) => withIdentity(req, res, false, () => readInstallation(assetId(req)))));
  app.post("/api/software-installations", respond((req, res) => withIdentity(req, res, true, user => createInventoryInstallation(user.id, payload(req) as never))));
  app.patch("/api/software-installations/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventoryInstallation(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/software-installations/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventoryInstallation(user.id, assetId(req)))));

  app.get("/api/locations", respond((req, res) => withIdentity(req, res, false, () => readLocations())));
  app.get("/api/locations/:id", respond((req, res) => withIdentity(req, res, false, () => readLocation(assetId(req)))));
  app.post("/api/locations", respond((req, res) => withIdentity(req, res, true, user => createInventoryLocation(user.id, payload(req) as never))));
  app.patch("/api/locations/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventoryLocation(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/locations/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventoryLocation(user.id, assetId(req)))));

  app.get("/api/relationships", respond((req, res) => withIdentity(req, res, false, () => readRelationships(req.query.assetId ? Number(req.query.assetId) : undefined))));
  app.post("/api/relationships", respond((req, res) => withIdentity(req, res, true, user => createInventoryRelationship(user.id, payload(req) as never))));
  app.patch("/api/relationships/:id", respond((req, res) => withIdentity(req, res, true, user => updateInventoryRelationship(user.id, assetId(req), payload(req) as never))));
  app.delete("/api/relationships/:id", respond((req, res) => withIdentity(req, res, true, user => removeInventoryRelationship(user.id, assetId(req)))));
}
