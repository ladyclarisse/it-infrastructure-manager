import { describe, expect, it, vi } from "vitest";
import { registerAlertingRestRoutes } from "./rest/alerting";

describe("alerting REST routes", () => {
  it("registers protected rule, alert and incident endpoints", () => {
    const app = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any;
    registerAlertingRestRoutes(app);
    const paths = [...app.get.mock.calls, ...app.post.mock.calls, ...app.patch.mock.calls, ...app.delete.mock.calls].map(call => call[0]);
    expect(paths).toEqual(expect.arrayContaining([
      "/api/alert-rules", "/api/alert-rules/:id", "/api/alerts", "/api/alerts/:id", "/api/incidents", "/api/incidents/:id", "/api/incidents/:id/acknowledge", "/api/incidents/:id/assign", "/api/incidents/:id/resolve", "/api/incidents/:id/close",
    ]));
    expect(app.post).toHaveBeenCalledWith("/api/alert-rules", expect.any(Function));
    expect(app.patch).toHaveBeenCalledWith("/api/incidents/:id", expect.any(Function));
  });
});
