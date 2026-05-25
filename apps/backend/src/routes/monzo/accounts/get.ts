import { ApiError } from "apps/backend/src/lib/api/error";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { getRefreshToken } from "apps/backend/src/lib/util";

const MonzoAccountsController = createController(
  async (ctx) => {
    const { err, refreshToken } = await getRefreshToken(ctx.user.id, "monzo");

    if (err) {
      return Response.json(
        { error: err },
        err === "doppler_client_failed" ? 500 : 401,
      );
    }

    if (!refreshToken) {
      return Response.redirect("/monzo/auth/error?missing_stored_refresh");
    }

    const monzoClient = new MonzoClient({
      refreshToken,
    });

    try {
      const accounts = await monzoClient.getAccounts();

      return Response.json(accounts);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(err.message, err.status || 500);
      } else {
        return Response.json((err as Error).message, 500);
      }
    }
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoAccountsController;
