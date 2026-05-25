import { serve } from "bun";
import { join } from "path";
import { getRoutes } from "./lib/router";
import { env } from "./env";

let index;

const routes = await getRoutes();

if (env.NODE_ENV === "development") {
  index = await import("../../web/index.html");
} else {
  index = await import("./web/index.html");
}

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
});

console.info(`🚀 Server running at http://${server.hostname}:${server.port}`);
