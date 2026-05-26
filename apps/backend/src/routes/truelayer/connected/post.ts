import { createController } from "apps/backend/src/lib/router";
import { TrueLayerClient } from "apps/backend/src/lib/truelayer/client";
import { z } from "zod";

const ConnectTrueLayerAccountController = createController(
  async (ctx) => {
    const trueLayerClient = new TrueLayerClient({ userId: ctx.user.id });

    await trueLayerClient.storeAccountIds(
      ctx.json.accountId,
      ctx.json.accountName,
    );

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
