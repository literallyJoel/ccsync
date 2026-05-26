import { serve } from "bun";
import { getRoutes } from "./lib/router";
import { env } from "./env";

const routes = await getRoutes();

const index = await import("../web/index.html");

const server = serve({
  hostname: "0.0.0.0",
  port: 8080,
  routes: {
    "/*": index.default,
    ...routes,
  },
  development: env.NODE_ENV === "development" && {
    hmr: true,
    console: true,
  },
  idleTimeout: 120
});

console.info(`🚀 Server running at http://${server.hostname}:${server.port}`);
