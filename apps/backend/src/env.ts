import { createEnv } from "@t3-oss/env-core";
import { env as bunEnv } from "bun";

import { z } from "zod";

export const env = createEnv({
  server: {
    MONZO_CLIENT_ID: z.string(),
    MONZO_CLIENT_SECRET: z.string(),
    MONZO_REDIRECT_URI: z.url(),

    TRUELAYER_CLIENT_ID: z.string(),
    TRUELAYER_CLIENT_SECRET: z.string(),
    TRUELAYER_REDIRECT_URI: z.url(),

    CLERK_SECRET_KEY: z.string(),
    CLERK_PUBLISHABLE_KEY: z.string(),

    DOPPLER_TOKEN: z.string(),
    DOPPLER_PROJECT: z.string(),
    DOPPLER_CONFIG: z.string(),

    RESEND_API_KEY: z.string(),
  
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: bunEnv,
  emptyStringAsUndefined: true,
});

