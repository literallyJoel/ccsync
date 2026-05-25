import { ApiError } from "apps/backend/src/lib/api/error";
import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { getRefreshToken } from "apps/backend/src/lib/util";
import { z } from "zod";

const PotDepositController = createController(
  async (ctx) => {
    const { err, refreshToken } = await getRefreshToken(ctx.user.id, "monzo");

    if (err) {
      return Response.json(
        { error: err },
        err === "doppler_client_failed" ? 500 : 401,
      );
    }

    const monzoClient = new MonzoClient({ refreshToken });

    const { accountId, amount, dedupeId, potId } = ctx.json;

    try {
      monzoClient.depositToPot({
        accountId,
        amount,
        dedupeId,
        potId,
      });

      return Response.json({ name: "OK" });
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
      amount: z.int().min(1),
      dedupeId: z.string().nonempty(),
      potId: z.string().nonempty(),
    }),
  },
);

export default PotDepositController;
