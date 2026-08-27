import { createApplication, startApplication } from "./app";
import { serveStatic } from "./static";

const { app, server } = createApplication();
serveStatic(app);
startApplication(server).catch(console.error);
