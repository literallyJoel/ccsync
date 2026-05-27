import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { getRefreshToken } from "apps/backend/src/lib/util";
import { AxiosError } from "axios";

const GetConnectedMonzoController = createController(
  async (ctx) => {
    const { refreshToken, err } = await getRefreshToken(ctx.user.id, "monzo");
    if (!refreshToken || err) {
      return Response.json({ error: "No account connected" }, { status: 404 });
    }
    const monzoClient = new MonzoClient({
      userId: ctx.user.id,
      refreshToken: refreshToken,
    });

    const { account, pot } = await monzoClient.getStoredAccount();

    if (!account || !pot) {
      return Response.json({ error: "No accounts found" }, { status: 404 });
    }
    const returnPot = {
      id: pot.id,
      name: pot.name,
      style: pot.style,
      cover_image_url: pot.cover_image_url,
    };

    const returnAccount = {
      id: account.id,
      is_flex: account.is_flex,
      assets: account.assets,
      owner_type: account.owner_type,
    };

    return Response.json({
      pot: returnPot,
      account: returnAccount,
    });
  },
  {
    requiresAuthentication: true,
  },
);

export default GetConnectedMonzoController;
