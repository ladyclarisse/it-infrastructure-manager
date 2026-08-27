import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

export const ROLE_SLUGS = {
  ADMIN: "admin",
  SYSTEMS_NETWORK_ADMIN: "systems_network_admin",
  TECHNICIAN: "technician",
  IT_MANAGER: "it_manager",
  USER: "user",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (ctx.user.status === "disabled") throw new TRPCError({ code: "FORBIDDEN", message: "User account is disabled" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export function roleProcedure(...allowedRoles: RoleSlug[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.user.role as RoleSlug)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const adminProcedure = roleProcedure(ROLE_SLUGS.ADMIN);
export const identityAdminProcedure = roleProcedure(ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER);
export const operationsProcedure = roleProcedure(ROLE_SLUGS.ADMIN, ROLE_SLUGS.IT_MANAGER, ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN, ROLE_SLUGS.TECHNICIAN);
