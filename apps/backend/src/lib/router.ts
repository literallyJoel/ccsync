import { createRouter } from "@literallyjoel/router";
import { join } from "path";
import { env } from "../env";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const { createController, getRoutes } = createRouter({
  routesDirectory: join(import.meta.dir, "..", "routes"),
  routePrefix: "/api",
  sessionGetter: async (_, request) => {
    const requestState = await clerk.authenticateRequest(request, {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });

    if (!requestState.isAuthenticated) {
      return null;
    }

    const { userId, sessionId, orgId } = requestState.toAuth();

    return {
      user: {
        id: userId,
      },
      org: {
        id: orgId,
      },
      id: sessionId,
    };
  },
});
