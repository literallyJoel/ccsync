import { env } from "apps/backend/src/env";
import { DopplerClient } from "apps/backend/src/lib/doppler/client";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";

const MonzoCallbackController = createController(
  async (ctx) => {
    const code = ctx.searchParams.get("code");

    if (!code) {
      return Response.json({ error: "missing_code" }, { status: 400 });
    }
    const monzoClient = new MonzoClient({
      userId: ctx.user.id,
    });
    const dopplerClient = new DopplerClient();

    const { token, refreshToken } = await monzoClient.getToken(code);

    const hostUrl =
      env.NODE_ENV === "development" ? "http://localhost:5173" : "";

    if (!token) {
      return Response.json(
        { error: hostUrl + "missing_token" },
        { status: 400 },
      );
    }

    if (!refreshToken) {
      return Response.json(
        { error: hostUrl + "missing_refresh" },
        { status: 400 },
      );
    }

    dopplerClient.set({
      key: MonzoClient.getRefreshTokenKey(ctx.user.id),
      value: refreshToken,
    });

    return new Response(undefined, { status: 200 });
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoCallbackController;
