import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { redis } from "bun";
import { z } from "zod";

const ConnectMonzoAccountController = createController(
  async (ctx) => {
    const monzoClient = new MonzoClient({ userId: ctx.user.id });
    await monzoClient.storeAccountIds(ctx.json.accountId, ctx.json.potId);

    const trueLayerInfo = await redis.get(`${ctx.user.id}_tlinf`);

    if (trueLayerInfo) {
      redis.set(`${ctx.user.id}_link_date`, String(Date.now()));
    }

    return Response.json("OK");
  },
  {
    requiresAuthentication: true,
    validationSchema: z.object({
      accountId: z.string(),
      potId: z.string(),
    }),
  },
);

export default ConnectMonzoAccountController;
