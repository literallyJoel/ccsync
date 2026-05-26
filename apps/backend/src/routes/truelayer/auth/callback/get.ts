import { env } from "apps/backend/src/env";
import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";

const TrueLayerCallbackController = createController(
  async (ctx) => {
    const code = ctx.searchParams.get("code");

    if (!code) {
      return Response.json({ error: "missing_code" }, { status: 400 });
    }

    const trueLayerClient = new TrueLayerClient({
      userId: ctx.user.id,
    });

    const dopplerClient = new DopplerClient();

    const { token, refreshToken } = await trueLayerClient.getToken(code);
    const hostUrl =
      env.NODE_ENV === "development" ? "http://localhost:5173" : "";

    if (!token) {
      return Response.json({ error: "missing_token" }, { status: 400 });
    }

    if (!refreshToken) {
      return Response.json({ error: "missing_refresh" }, { status: 400 });
    }

    dopplerClient.set({
      key: TrueLayerClient.getRefreshTokenKey(ctx.user.id),
      value: refreshToken,
    });

    return new Response(undefined, { status: 200 });
  },
  {
    requiresAuthentication: true,
  },
);

export default TrueLayerCallbackController;
