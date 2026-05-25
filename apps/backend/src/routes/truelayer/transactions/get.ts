import { ApiError } from "apps/backend/src/lib/api/error";
import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";
import { getRefreshToken } from "apps/backend/src/lib/util";
import { z } from "zod";

//todo Return sync status with transactions

const TrueLayerTransactionsController = createController(
  async (ctx) => {
    const { accountId, from, to, status } = ctx.json;

    const { err, refreshToken } = await getRefreshToken(
      ctx.user.id,
      "truelayer",
    );

    if (err) {
      return Response.json(
        { error: err },
        err === "doppler_client_failed" ? 500 : 401,
      );
    }

    const trueLayerClient = new TrueLayerClient({ refreshToken });

    try {
      const func =
        status === "pending"
          ? trueLayerClient.getPendingTransactions
          : status === "settled"
            ? trueLayerClient.getSettledTransactions
            : trueLayerClient.getAllTransactions;

      const transactions = func(accountId, from, to);

      return Response.json(transactions);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json({ error: error.message }, error.status || 500);
      } else {
        return Response.json({ error: (error as Error).message }, 500);
      }
    }
  },
  {
    requiresAuthentication: true,
    validationSchema: z.object({
      accountId: z.string().nonempty(),
      from: z.iso.date(),
      to: z.iso.date(),
      status: z.enum(["pending", "settled"]).optional(),
    }),
  },
);

export default TrueLayerTransactionsController;
