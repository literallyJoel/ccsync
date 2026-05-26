import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";

const MonzoAuthController = createController(
  async (ctx) => {
    const monzoClient = new MonzoClient({ userId: ctx.user.id });
    const connectAccountUrl = monzoClient.connectAccountUrl;

    return Response.json({ url: connectAccountUrl });
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoAuthController;
