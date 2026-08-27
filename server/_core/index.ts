import { setupVite } from "./vite";
import { createApplication, startApplication } from "./app";

async function startDevelopmentServer() {
  const { app, server } = createApplication();
  await setupVite(app, server);
  await startApplication(server);
}

startDevelopmentServer().catch(console.error);
