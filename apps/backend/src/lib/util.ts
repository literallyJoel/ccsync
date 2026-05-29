import { DopplerClient } from "./doppler/client";
import { MonzoClient } from "./monzo/client";
import { TrueLayerClient } from "./truelayer/client";

export async function getRefreshToken(
  userId: string,
  type: "monzo" | "truelayer",
) {
  let dopplerClient: DopplerClient;

  try {
    dopplerClient = new DopplerClient();
  } catch {
    return { err: "doppler_client_failed" };
  }

  const Client = type === "monzo" ? MonzoClient : TrueLayerClient;

  const refreshSecret = await dopplerClient.get(
    Client.getRefreshTokenKey(userId),
  );

  const refreshToken = refreshSecret?.value.raw;
  if (!refreshToken) {
    return { err: "no_refresh_token" };
  }

  return { refreshToken };
}
