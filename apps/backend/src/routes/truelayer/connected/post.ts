import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";
import { redis } from "bun";
import { z } from "zod";

const ConnectTrueLayerAccountController = createController(
  async (ctx) => {
    const trueLayerClient = new TrueLayerClient({ userId: ctx.user.id });

    await trueLayerClient.storeAccountIds(
      ctx.json.accountId,
      ctx.json.accountName,
    );

    const monzoLink = await redis.get(`${ctx.user.id}_monzoinf`);

    if (monzoLink) {
      await redis.set(`${ctx.user.id}_link_date`, String(Date.now()));
    }

    return Response.json("OK");
  },
  {
    requiresAuthentication: true,
    validationSchema: z.object({
      accountId: z.string(),
      accountName: z.string(),
    }),
  },
);

export default ConnectTrueLayerAccountController;
