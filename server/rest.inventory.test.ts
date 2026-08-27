import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { httpError, registerInventoryRestRoutes } from "./rest/inventory";

describe("inventory REST facade", () => {
  it("maps authentication and validation errors to stable HTTP responses", () => {
    expect(httpError(new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" }))).toEqual({ status: 401, body: { error: { code: "UNAUTHORIZED", message: "Authentication required" } } });
    expect(httpError(new TRPCError({ code: "BAD_REQUEST", message: "Invalid payload" }))).toEqual({ status: 400, body: { error: { code: "BAD_REQUEST", message: "Invalid payload" } } });
  });

  it("registers read and write routes for every inventory resource", () => {
    const app = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any;
    registerInventoryRestRoutes(app);
    const registered = [...app.get.mock.calls, ...app.post.mock.calls, ...app.patch.mock.calls, ...app.delete.mock.calls].map(call => call[0]);
    expect(registered).toEqual(expect.arrayContaining([
      "/api/assets", "/api/assets/:id", "/api/network-devices", "/api/network-devices/:assetId", "/api/network-interfaces", "/api/network-interfaces/:id", "/api/software", "/api/software/:id", "/api/software-installations", "/api/software-installations/:id", "/api/locations", "/api/locations/:id", "/api/relationships", "/api/relationships/:id",
    ]));
    expect(app.post).toHaveBeenCalled();
    expect(app.patch).toHaveBeenCalled();
    expect(app.delete).toHaveBeenCalled();
  });
});
