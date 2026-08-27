export function formatIncidentCode(id: number) { return `INC-${String(id).padStart(4, "0")}`; }
export function metricValue(value: number, unavailable: boolean) { return unavailable ? "—" : value; }
export function emptyStateFor(kind: "alerts" | "incidents", unavailable: boolean) { if (unavailable) return "API unavailable"; return kind === "alerts" ? "No alert data" : "No incidents"; }
