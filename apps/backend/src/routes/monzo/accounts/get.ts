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
        { status: err === "doppler_client_failed" ? 500 : 401 },
      );
    }

    if (!refreshToken) {
      return Response.redirect("/monzo/auth/error?missing_stored_refresh");
    }

    const monzoClient = new MonzoClient({
      refreshToken,
      userId: ctx.user.id,
    });

    try {
      const accounts = await monzoClient.getAccounts();

      const ret = accounts.map((account) => ({
        id: account.id,
        is_flex: account.is_flex,
        assets: account.assets,
        owner_type: account.owner_type,
      }));

      return Response.json(ret);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(
          { error: err.message },
          { status: err.status || 500 },
        );
      } else {
        return Response.json(
          { error: (err as Error).message },
          { status: 500 },
        );
      }
    }
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoAccountsController;
