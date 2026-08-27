export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  prometheusUrl: process.env.PROMETHEUS_URL ?? "http://localhost:9090",
  prometheusTimeoutMs: Number(process.env.PROMETHEUS_TIMEOUT_MS ?? 3000),
  monitoringEnabled: process.env.MONITORING_ENABLED !== "false",
};
