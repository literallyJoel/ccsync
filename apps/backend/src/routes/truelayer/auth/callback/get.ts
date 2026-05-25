import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";

const TrueLayerCallbackController = createController(
  async (ctx) => {
    const code = ctx.searchParams.get("code");

    if (!code) {
      return Response.redirect("/truelayer/auth/error?reason=missing_code");
    }

    const trueLayerClient = new TrueLayerClient();
    const dopplerClient = new DopplerClient();

    const { token, refreshToken } = await trueLayerClient.getToken(code);

    if (!token) {
      return Response.redirect("/truelayer/auth/error?reason=missing_token");
    }

    if (!refreshToken) {
      return Response.redirect(
        "/truelayer/auth/error?reason=missing_refresh",
      );
    }

    dopplerClient.set({
      key: `${ctx.user.id}-truelayer_refresh`,
      value: refreshToken,
    });

    return Response.redirect("/");
  },
  {
    requiresAuthentication: true,
  },
);

export default TrueLayerCallbackController;
