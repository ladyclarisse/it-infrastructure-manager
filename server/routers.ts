import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, identityAdminProcedure, publicProcedure, ROLE_SLUGS, router } from "./_core/trpc";
import { createAuditLog } from "./db";
import { changeUserAccess, listIdentityRoles, listIdentityUsers } from "./services/identity";
import { getRecentAudit, recordAuthEvent, ROLE_CATALOG } from "./services/access";

const roleSchema = z.enum([
  ROLE_SLUGS.ADMIN,
  ROLE_SLUGS.SYSTEMS_NETWORK_ADMIN,
  ROLE_SLUGS.TECHNICIAN,
  ROLE_SLUGS.IT_MANAGER,
  ROLE_SLUGS.USER,
]);
const statusSchema = z.enum(["active", "disabled"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) await recordAuthEvent(ctx.user.id, "AUTH_SESSION_CHECK", ctx.req);
      return ctx.user;
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) await recordAuthEvent(ctx.user.id, "AUTH_LOGOUT", ctx.req);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  users: router({
    list: identityAdminProcedure.input(z.object({ search: z.string().max(120).optional() }).optional()).query(({ input }) => listIdentityUsers(input?.search)),
    roles: identityAdminProcedure.query(async () => {
      return listIdentityRoles().then(persisted => persisted.length ? persisted : ROLE_CATALOG);
    }),
    updateAccess: identityAdminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: roleSchema.optional(), status: statusSchema.optional() }).refine(value => value.role || value.status, "At least one access change is required"))
      .mutation(async ({ ctx, input }) => {
        return changeUserAccess({ actorUserId: ctx.user.id, userId: input.userId, role: input.role, status: input.status });
      }),
  }),
  audit: router({
    recent: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) })).query(({ input }) => getRecentAudit(input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
