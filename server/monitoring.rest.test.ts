import { describe, expect, it, vi } from "vitest";
import { registerMonitoringRestRoutes } from "./rest/monitoring";

describe("monitoring REST routes", () => {
  it("registers target CRUD and observation endpoints", () => {
    const app = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any;
    registerMonitoringRestRoutes(app);
    const paths = [...app.get.mock.calls, ...app.post.mock.calls, ...app.patch.mock.calls, ...app.delete.mock.calls].map(call => call[0]);
    expect(paths).toEqual(expect.arrayContaining([
      "/api/monitoring/targets",
      "/api/monitoring/targets/:id",
      "/api/monitoring/targets/:id/status",
      "/api/monitoring/targets/:id/metrics",
    ]));
    expect(app.post).toHaveBeenCalledWith("/api/monitoring/targets", expect.any(Function));
    expect(app.patch).toHaveBeenCalledWith("/api/monitoring/targets/:id", expect.any(Function));
    expect(app.delete).toHaveBeenCalledWith("/api/monitoring/targets/:id", expect.any(Function));
  });
});
