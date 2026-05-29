import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";
import { getRefreshToken } from "apps/backend/src/lib/util";

const GetConnectedTrueLayerController = createController(
  async (ctx) => {
    const { refreshToken, err } = await getRefreshToken(
      ctx.user.id,
      "truelayer",
    );

    if (!refreshToken || err) {
      return Response.json({ error: "No account connected" }, { status: 404 });
    }

    const trueLayerClient = new TrueLayerClient({
      userId: ctx.user.id,
      refreshToken,
    });

    const account = await trueLayerClient.getStoredAccount();

    if (!account) {
      return Response.json({ error: "No account stored" }, { status: 404 });
    }

    const returnAccount = {
      id: account.account_id,
      providerName: account.provider.display_name,
      providerLogo: account.provider.logo_uri,
      displayName: account.display_name,
    };

    return Response.json({ account: returnAccount });
  },
  {
    requiresAuthentication: true,
  },
);

export default GetConnectedTrueLayerController;
