import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const frontendDockerfile = read("../docker/frontend.Dockerfile");
const nginxConfig = read("../docker/nginx.conf");

describe("production frontend proxy", () => {
  it("installs the project Nginx configuration in the frontend image", () => {
    expect(frontendDockerfile).toContain("COPY docker/nginx.conf /etc/nginx/conf.d/default.conf");
  });

  it("relays API and OAuth routes to the internal backend while retaining SPA fallback", () => {
    expect(nginxConfig).toContain("location /api/");
    expect(nginxConfig).toContain("proxy_pass http://backend:3000;");
    expect(nginxConfig).toContain("proxy_set_header Host $http_host;");
    expect(nginxConfig).toContain("proxy_set_header X-Forwarded-Proto $scheme;");
    expect(nginxConfig).toContain("try_files $uri $uri/ /index.html;");
  });
});
