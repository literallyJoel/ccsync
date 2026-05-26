import { MonzoClient } from "apps/backend/src/lib/monzo/client";
import { createController } from "apps/backend/src/lib/router";
import { z } from "zod";

const ConnectMonzoAccountController = createController(
  async (ctx) => {
    const monzoClient = new MonzoClient({ userId: ctx.user.id });
    monzoClient.storeAccountIds(ctx.json.accountId, ctx.json.potId);

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
