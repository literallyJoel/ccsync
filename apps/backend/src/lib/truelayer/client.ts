import type {
  GetAccountResponse,
  GetTransactionsResponse,
  Account,
  ClientConstructorProps,
  Transaction,
} from "./types";
import { APIClient } from "../api/client";
import { env } from "../../env";
import { ApiError } from "../api/error";

const AUTH_URLS = {
  production: "https://auth.truelayer.com",
  sandbox: "https://auth.truelayer-sandbox.com",
} as const;

const API_URLS = {
  production: "https://api.truelayer.com/data/v1",
  sandbox: "https://api.truelayer-sandbox.com/data/v1",
} as const;

export class TrueLayerClient extends APIClient {
  protected override readonly tokenEndpoint: string;
  private readonly baseAuthUrl: string;

  constructor(props?: ClientConstructorProps) {
    const environment = props?.sandbox ? "sandbox" : "production";
    const authBaseUrl = AUTH_URLS[environment];

    const _clientId = props?.clientId || env.TRUELAYER_CLIENT_ID;
    const _clientSecret = props?.clientSecret || env.TRUELAYER_CLIENT_SECRET;
    const _redirectUri = props?.redirectUri || env.TRUELAYER_REDIRECT_URI;

    super({
      clientId: _clientId,
      clientSecret: _clientSecret,
      redirectUri: _redirectUri,
      token: props?.token,
      refreshToken: props?.refreshToken,
      apiBaseUrl: API_URLS[environment],
    });

    this.baseAuthUrl = authBaseUrl;
    this.tokenEndpoint = `${authBaseUrl}/connect/token`;
  }

  buildConnectAccountUrl(email: string, scopes: string[], providerId?: string) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scopes: scopes.join(" "),
      user_email: email,
      providers: "uk-ob-all",
      ...(providerId && { provider_id: providerId }),
    });

    return `${this.baseAuthUrl}/?${params.toString()}`;
  }

  async getAccounts(): Promise<Account[]> {
    return this.withRetry(async () => {
      const response =
        await this.apiClient.get<GetAccountResponse>("/accounts");
      return response.data.results;
    }, "Failed to fetch accounts");
  }

  async getSettledTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<Transaction[]> {
    return this.withRetry(async () => {
      const response = await this.apiClient.get<GetTransactionsResponse>(
        `/accounts/${accountId}/transactions`,
        {
          params: { from, to },
        },
      );

      return response.data.results.map((transaction) => ({
        ...transaction,
        status: "settled",
      }));
    }, "Failed to fetch settled transactions for account " + accountId);
  }

  async getPendingTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<Transaction[]> {
    return this.withRetry(async () => {
      const response = await this.apiClient.get<GetTransactionsResponse>(
        `/accounts/${accountId}/transactions/pending`,
        {
          params: { from, to },
        },
      );

      return response.data.results.map((transaction) => ({
        ...transaction,
        status: "pending",
      }));
    }, "Failed to fetch pending transactions for account " + accountId);
  }

  async getAllTransactions(
    accountId: string,
    from: string,
    to: string,
  ): Promise<Transaction[]> {
    try {
      const settledTransactions = await this.getSettledTransactions(
        accountId,
        from,
        to,
      );
      const pendingTransactions = await this.getPendingTransactions(
        accountId,
        from,
        to,
      );

      return [...settledTransactions, ...pendingTransactions];
    } catch (err) {
      throw this.createError(
        err,
        "failed to fetch transactions for account " + accountId,
      );
    }
  }

  static getRefreshTokenKey(userId: string) {
    return `${userId}-truelayer_refresh`;
  }
}
