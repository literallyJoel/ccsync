import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";

const GetConnectedTrueLayerController = createController(
  async (ctx) => {
    const dopplerClient = new DopplerClient();
    const tlToken = await dopplerClient.get(
      TrueLayerClient.getRefreshTokenKey(ctx.user.id),
    );

    if (!tlToken) {
      return Response.json({ error: "No account connected" }, { status: 404 });
    }

    const trueLayerClient = new TrueLayerClient({
      userId: ctx.user.id,
      refreshToken: tlToken.value.raw,
    });

    const account = await trueLayerClient.getStoredAccount();

    if (!account) {
      return Response.json({ error: "No account stored" }, { status: 404 });
    }

    const returnAccount = {
      id: account.account_id,
      provider: account.provider,
      displayName: account.display_name,
    };

    return Response.json({ account: returnAccount }, { status: 404 });
  },
  {
    requiresAuthentication: true,
  },
);

export default GetConnectedTrueLayerController;
