import type { Express, Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { createContext } from "../_core/context";
import { ROLE_SLUGS } from "../_core/trpc";
import { createConfiguredMonitoringTarget, getConfiguredMonitoringTarget, getMonitoringObservation, listConfiguredMonitoringTargets, removeConfiguredMonitoringTarget, updateConfiguredMonitoringTarget } from "../services/monitoring";
import { httpError } from "./inventory";

const writeRoles = new Set<string>([ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN]);

type User = NonNullable<Awaited<ReturnType<typeof createContext>>["user"]>;
type Handler = (req: Request, res: Response) => Promise<unknown>;

async function withIdentity(req: Request, res: Response, write: boolean, handler: (user: User) => Promise<unknown>) {
  const context = await createContext({ req, res } as Parameters<typeof createContext>[0]);
  if (!context.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  if (write && !writeRoles.has(context.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Monitoring write permission required" });
  return handler(context.user);
}

function respond(handler: Handler): Handler { return async (req, res) => { try { res.status(200).json(await handler(req, res)); } catch (error) { const mapped = httpError(error); res.status(mapped.status).json(mapped.body); } }; }
function id(req: Request) { const value = Number(req.params.id); if (!Number.isInteger(value) || value < 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid monitoring target id" }); return value; }
function body(req: Request) { return req.body && typeof req.body === "object" ? req.body : {}; }

export function registerMonitoringRestRoutes(app: Express) {
  app.get("/api/monitoring/targets", respond((req, res) => withIdentity(req, res, false, () => listConfiguredMonitoringTargets())));
  app.get("/api/monitoring/targets/:id", respond((req, res) => withIdentity(req, res, false, () => getConfiguredMonitoringTarget(id(req)))));
  app.post("/api/monitoring/targets", respond((req, res) => withIdentity(req, res, true, user => createConfiguredMonitoringTarget(user.id, body(req) as never))));
  app.patch("/api/monitoring/targets/:id", respond((req, res) => withIdentity(req, res, true, user => updateConfiguredMonitoringTarget(user.id, id(req), body(req) as never))));
  app.delete("/api/monitoring/targets/:id", respond((req, res) => withIdentity(req, res, true, user => removeConfiguredMonitoringTarget(user.id, id(req)))));
  app.get("/api/monitoring/targets/:id/status", respond((req, res) => withIdentity(req, res, false, () => getMonitoringObservation(id(req)).then(observation => ({ target: observation.target, backendStatus: observation.backendStatus, targetStatus: observation.targetStatus, observedAt: observation.observedAt, error: observation.error })))));
  app.get("/api/monitoring/targets/:id/metrics", respond((req, res) => withIdentity(req, res, false, () => getMonitoringObservation(id(req)))));
}
