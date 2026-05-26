import { ApiError } from "apps/backend/src/lib/api/error";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { getRefreshToken } from "apps/backend/src/lib/util";

const MonzoPotsController = createController(
  async (ctx) => {
    const accountId = ctx.searchParams.get("accountId");

    if (!accountId) {
      return Response.json({ error: "missing_account_id" }, { status: 400 });
    }

    const { err, refreshToken } = await getRefreshToken(ctx.user.id, "monzo");

    if (err) {
      return Response.json(
        { error: err },
        { status: err === "doppler_client_failed" ? 500 : 401 },
      );
    }

    if (!refreshToken) {
      return Response.json({ error: "missing_refresh" }, { status: 401 });
    }

    const monzoClient = new MonzoClient({
      refreshToken,
      userId: ctx.user.id,
    });

    try {
      const pots = await monzoClient.getPots(accountId);

      return Response.json(pots);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(
          { error: err.message },
          { status: err.status || 500 },
        );
      }

      return Response.json({ error: (err as Error).message }, { status: 500 });
    }
  },
  {
    requiresAuthentication: true,
  },
);

export default MonzoPotsController;
