import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";

const MonzoCallbackController = createController(
  async (ctx) => {
    const code = ctx.searchParams.get("code");

    if (!code) {
      return Response.redirect("/monzo/auth/error?reason=missing_code");
    }

    const monzoClient = new MonzoClient();
    const dopplerClient = new DopplerClient();

    const { token, refreshToken } = await monzoClient.getToken(code);

    if (!token) {
      return Response.redirect("/monzo/auth/error?reason=mising_token");
    }

    if (!refreshToken) {
      return Response.redirect("/monzo/auth/error?reason=missing_refresh");
    }

    dopplerClient.set({
      key: MonzoClient.getRefreshTokenKey(ctx.user.id),
      value: refreshToken,
    });

    return Response.redirect("/");
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoCallbackController;
