import { TRPCError } from "@trpc/server";
import type { Express, Request, RequestHandler, Response } from "express";
import { createContext } from "../_core/context";
import { ROLE_SLUGS } from "../_core/trpc";
import { assignIncident, createConfiguredAlertRule, createManualIncident, getConfiguredAlertRule, getIncidentDetails, getObservedAlert, listConfiguredAlertRules, listOpenIncidents, listObservedAlerts, removeConfiguredAlertRule, transitionIncident, updateConfiguredAlertRule } from "../services/alerting";
import { httpError } from "./inventory";

const writeRoles = new Set<string>([ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN]);
type User = NonNullable<Awaited<ReturnType<typeof createContext>>["user"]>;
type AsyncHandler = (req: Request, res: Response) => Promise<unknown>;
async function withIdentity(req: Request, res: Response, write: boolean, handler: (user: User) => Promise<unknown>) { const context = await createContext({ req, res } as Parameters<typeof createContext>[0]); if (!context.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" }); if (write && !writeRoles.has(context.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Alerting write permission required" }); return handler(context.user); }
function respond(handler: AsyncHandler): RequestHandler { return async (req, res) => { try { res.status(200).json(await handler(req, res)); } catch (error) { const mapped = httpError(error); res.status(mapped.status).json(mapped.body); } }; }
function id(req: Request) { const value = Number(req.params.id); if (!Number.isInteger(value) || value < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid alerting resource id" }); return value; }
function body(req: Request) { return req.body && typeof req.body === "object" ? req.body : {}; }
function filters(req: Request) { const query = req.query as Record<string, string | undefined>; return { status: query.status as never, severity: query.severity as never, assignedToUserId: query.assignedToUserId ? Number(query.assignedToUserId) : undefined, monitoringTargetId: query.monitoringTargetId ? Number(query.monitoringTargetId) : undefined, createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined, createdTo: query.createdTo ? new Date(query.createdTo) : undefined }; }

export function registerAlertingRestRoutes(app: Express) {
  app.get("/api/alert-rules", respond((req, res) => withIdentity(req, res, false, () => listConfiguredAlertRules())));
  app.get("/api/alert-rules/:id", respond((req, res) => withIdentity(req, res, false, () => getConfiguredAlertRule(id(req)))));
  app.post("/api/alert-rules", respond((req, res) => withIdentity(req, res, true, user => createConfiguredAlertRule(user.id, body(req) as never))));
  app.patch("/api/alert-rules/:id", respond((req, res) => withIdentity(req, res, true, user => updateConfiguredAlertRule(user.id, id(req), body(req) as never))));
  app.delete("/api/alert-rules/:id", respond((req, res) => withIdentity(req, res, true, user => removeConfiguredAlertRule(user.id, id(req)))));
  app.get("/api/alerts", respond((req, res) => withIdentity(req, res, false, () => listObservedAlerts(filters(req)))));
  app.get("/api/alerts/:id", respond((req, res) => withIdentity(req, res, false, () => getObservedAlert(id(req)))));
  app.get("/api/incidents", respond((req, res) => withIdentity(req, res, false, () => listOpenIncidents(filters(req)))));
  app.get("/api/incidents/:id", respond((req, res) => withIdentity(req, res, false, () => getIncidentDetails(id(req)))));
  app.post("/api/incidents", respond((req, res) => withIdentity(req, res, true, user => createManualIncident(user.id, body(req) as never))));
  app.patch("/api/incidents/:id", respond((req, res) => withIdentity(req, res, true, user => transitionIncident(user.id, id(req), (body(req) as { status: never }).status, (body(req) as { resolutionNotes?: string }).resolutionNotes))));
  app.post("/api/incidents/:id/acknowledge", respond((req, res) => withIdentity(req, res, true, user => transitionIncident(user.id, id(req), "ACKNOWLEDGED"))));
  app.post("/api/incidents/:id/assign", respond((req, res) => withIdentity(req, res, true, user => assignIncident(user.id, id(req), (body(req) as { assignedToUserId: number | null }).assignedToUserId))));
  app.post("/api/incidents/:id/resolve", respond((req, res) => withIdentity(req, res, true, user => transitionIncident(user.id, id(req), "RESOLVED", (body(req) as { resolutionNotes?: string }).resolutionNotes))));
  app.post("/api/incidents/:id/close", respond((req, res) => withIdentity(req, res, true, user => transitionIncident(user.id, id(req), "CLOSED"))));
}
