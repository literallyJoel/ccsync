import { ApiError } from "apps/backend/src/lib/api/error";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";
import { getRefreshToken } from "apps/backend/src/lib/util";

const TrueLayerAccountsController = createController(
  async (ctx) => {
    const { err, refreshToken } = await getRefreshToken(
      ctx.user.id,
      "truelayer",
    );

    if (err) {
      return Response.json(
        { error: err },
        { status: err === "doppler_client_failed" ? 500 : 401 },
      );
    }

    const trueLayerClient = new TrueLayerClient({
      refreshToken,
      userId: ctx.user.id,
    });

    try {
      const accounts = await trueLayerClient.getAccounts();

      return Response.json(accounts);
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

export default TrueLayerAccountsController;
