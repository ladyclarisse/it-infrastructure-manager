import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const frontendDockerfile = read("../docker/frontend.Dockerfile");
const nginxConfig = read("../docker/nginx.conf");
const oauthClient = read("../client/src/const.ts");

describe("production frontend proxy", () => {
  it("installs the project Nginx configuration and receives public OAuth build args", () => {
    expect(frontendDockerfile).toContain("ARG VITE_APP_ID");
    expect(frontendDockerfile).toContain("ARG VITE_OAUTH_PORTAL_URL");
    expect(frontendDockerfile).toContain("ENV VITE_APP_ID=$VITE_APP_ID");
    expect(frontendDockerfile).toContain("ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL");
    expect(frontendDockerfile).toContain("COPY docker/nginx.conf /etc/nginx/conf.d/default.conf");
  });

  it("allows the local interface to build without silently attempting an invalid OAuth URL", () => {
    const compose = read("../docker-compose.yml");
    expect(compose).toContain("VITE_APP_ID: ${VITE_APP_ID:-}");
    expect(compose).toContain("VITE_OAUTH_PORTAL_URL: ${VITE_OAUTH_PORTAL_URL:-https://oauth.manus.im}");
    expect(oauthClient).toContain("const oauthPortalUrl = (import.meta.env.VITE_OAUTH_PORTAL_URL || \"https://oauth.manus.im\").trim();");
    expect(oauthClient).toContain("console.warn(\"[OAuth] Login unavailable: VITE_APP_ID is not configured for this local build\")");
  });

  it("relays API and OAuth routes to the internal backend while retaining SPA fallback", () => {
    expect(nginxConfig).toContain("location /api/");
    expect(nginxConfig).toContain("proxy_pass http://backend:3000;");
    expect(nginxConfig).toContain("proxy_set_header Host $http_host;");
    expect(nginxConfig).toContain("proxy_set_header X-Forwarded-Proto $scheme;");
    expect(nginxConfig).toContain("try_files $uri $uri/ /index.html;");
  });
});
