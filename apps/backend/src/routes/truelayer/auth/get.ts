import { createClerkClient } from "@clerk/backend";
import { env } from "apps/backend/src/env";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";

const TrueLayerAuthController = createController(
  async (ctx) => {
    const trueLayerClient = new TrueLayerClient({ userId: ctx.user.id });
    const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    const user = await clerkClient.users.getUser(ctx.user.id);

    if (!user) {
      return Response.redirect("/truelayer/auth/error?error=no_user");
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return Response.redirect("/truelayer/auth/error?error=no_email");
    }

    const trueLayerAuthUrl = trueLayerClient.buildConnectAccountUrl(
      user.primaryEmailAddress?.emailAddress,
      ["accounts", "transactions", "offline_access"],
    );

    return Response.json({ url: trueLayerAuthUrl });
  },
  {
    requiresAuthentication: true,
  },
);

export default TrueLayerAuthController;
