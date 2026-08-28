import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const frontendDockerfile = read("../docker/frontend.Dockerfile");
const nginxConfig = read("../docker/nginx.conf");

describe("production frontend proxy", () => {
  it("installs the project Nginx configuration and receives public OAuth build args", () => {
    expect(frontendDockerfile).toContain("ARG VITE_APP_ID");
    expect(frontendDockerfile).toContain("ARG VITE_OAUTH_PORTAL_URL");
    expect(frontendDockerfile).toContain("ENV VITE_APP_ID=$VITE_APP_ID");
    expect(frontendDockerfile).toContain("ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL");
    expect(frontendDockerfile).toContain("COPY docker/nginx.conf /etc/nginx/conf.d/default.conf");
  });

  it("requires public OAuth values in Compose instead of silently building a dead login button", () => {
    const compose = read("../docker-compose.yml");
    expect(compose).toContain("VITE_APP_ID must be provided for frontend build");
    expect(compose).toContain("VITE_OAUTH_PORTAL_URL must be provided for frontend build");
  });

  it("relays API and OAuth routes to the internal backend while retaining SPA fallback", () => {
    expect(nginxConfig).toContain("location /api/");
    expect(nginxConfig).toContain("proxy_pass http://backend:3000;");
    expect(nginxConfig).toContain("proxy_set_header Host $http_host;");
    expect(nginxConfig).toContain("proxy_set_header X-Forwarded-Proto $scheme;");
    expect(nginxConfig).toContain("try_files $uri $uri/ /index.html;");
  });
});
