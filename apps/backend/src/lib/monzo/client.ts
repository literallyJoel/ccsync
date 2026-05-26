import type {
  GetAccountsResponse,
  GetPotsResponse,
  Account,
  ClientConstructorProps,
  Pot,
} from "./types";

import { APIClient } from "../api/client";
import { env } from "../../env";
import { DopplerClient } from "../doppler/client";

const API_URL = "https://api.monzo.com";
const AUTH_URL = "https://auth.monzo.com";

export class MonzoClient extends APIClient {
  protected override readonly tokenEndpoint = `${API_URL}/oauth2/token`;
  private readonly state_token: string;
  readonly connectAccountUrl: string;

  constructor(props: ClientConstructorProps) {
    let _clientId = props?.clientId || env.MONZO_CLIENT_ID;
    let _clientSecret = props?.clientSecret || env.MONZO_CLIENT_SECRET;
    let _redirectUri = props?.redirectUri || env.MONZO_REDIRECT_URI;

    super({
      clientId: _clientId,
      clientSecret: _clientSecret,
      redirectUri: _redirectUri,
      token: props.token,
      refreshToken: props.refreshToken,
      apiBaseUrl: API_URL,
      userId: props?.userId,
    });

    this.state_token = crypto.randomUUID();

    const connectAccountParams = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      state: this.state_token,
    });

    this.connectAccountUrl = `${AUTH_URL}/?${connectAccountParams.toString()}`;
  }

  async getAccounts(): Promise<Account[]> {
    return this.withRetry(async () => {
      const response =
        await this.apiClient.get<GetAccountsResponse>("/accounts");
      return response.data.accounts;
    }, "Failed to fetch accounts");
  }

  async getPots(accountId: string): Promise<Pot[]> {
    return this.withRetry(async () => {
      const response = await this.apiClient.get<GetPotsResponse>("/pots", {
        params: { current_account_id: accountId },
      });

      return response.data.pots;
    }, "Failed to fetch pots");
  }

  async depositToPot({
    accountId,
    amount,
    dedupeId,
    potId,
  }: {
    accountId: string;
    amount: number;
    dedupeId: string;
    potId: string;
  }) {
    return this.withRetry(async () => {
      const response = await this.apiClient.put<Pot>(
        `/pots/${potId}/deposit`,
        new URLSearchParams({
          source_account_id: accountId,
          amount: String(amount),
          dedupe_id: dedupeId,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return response.data;
    }, "Failed to deposit to pot");
  }

  async withdrawFromPot({
    accountId,
    amount,
    dedupeId,
    potId,
  }: {
    accountId: string;
    amount: number;
    dedupeId: string;
    potId: string;
  }) {
    return this.withRetry(async () => {
      const response = await this.apiClient.put<Pot>(
        `/pots/${potId}/withdraw`,
        new URLSearchParams({
          destination_account_id: accountId,
          amount: String(amount),
          dedupe_id: dedupeId,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );

      return response.data;
    }, "Failed to withdraw from pot");
  }

  static getRefreshTokenKey(userId: string) {
    return `${userId}-monzo_refresh`;
  }

  protected async onRefreshTokenRotated(
    _newRefreshToken: string,
  ): Promise<void> {
    const dopplerClient = new DopplerClient();

    dopplerClient.set({
      key: MonzoClient.getRefreshTokenKey(this.userId),
      value: _newRefreshToken,
    });
  }
}
