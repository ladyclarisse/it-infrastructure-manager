import { describe, expect, it } from "vitest";
import { emptyStateFor, formatIncidentCode, metricValue } from "./alertingPresentation";

describe("alerting presentation", () => {
  it("formats incident identifiers consistently", () => { expect(formatIncidentCode(1)).toBe("INC-0001"); expect(formatIncidentCode(42)).toBe("INC-0042"); });
  it("does not render zero metrics when the backend is unavailable", () => { expect(metricValue(0, true)).toBe("—"); expect(metricValue(0, false)).toBe(0); });
  it("distinguishes API errors from empty collections", () => { expect(emptyStateFor("alerts", true)).toBe("API unavailable"); expect(emptyStateFor("incidents", true)).toBe("API unavailable"); expect(emptyStateFor("alerts", false)).toBe("No alert data"); expect(emptyStateFor("incidents", false)).toBe("No incidents"); });
});
