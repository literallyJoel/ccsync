import axios from "axios";
import type { BaseClientConstructorProps, GetTokenResponse } from "./types";
import { ApiError } from "./error";

export abstract class APIClient {
  protected refreshPromise?: Promise<GetTokenResponse>;
  protected readonly apiClient;
  protected readonly clientId: string;
  protected readonly clientSecret: string;
  protected readonly redirectUri: string;
  protected token?: string;
  protected refreshToken?: string;

  protected abstract readonly tokenEndpoint: string;

  constructor({
    clientId,
    clientSecret,
    redirectUri,
    token,
    refreshToken,
    apiBaseUrl,
  }: BaseClientConstructorProps) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.token = token;
    this.refreshToken = refreshToken;

    this.apiClient = axios.create({ baseURL: apiBaseUrl });
    this.apiClient.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      return config;
    });
  }

  protected createError(
    err: unknown,
    fallbackMessage: string,
    status?: number,
  ): ApiError {
    return ApiError.fromUnknown(err, fallbackMessage, status);
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    let retried = false;
    const attempt = async (): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 401 &&
          !retried
        ) {
          retried = true;
          await this.refreshAccessToken();
          return attempt();
        }

        throw this.createError(err, errorMessage);
      }
    };

    return attempt();
  }

  protected async postToken(
    params: Record<string, string>,
  ): Promise<GetTokenResponse> {
    try {
      const response = await axios.post<GetTokenResponse>(
        this.tokenEndpoint,
        new URLSearchParams(params),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return response.data;
    } catch (err) {
      throw this.createError(err, "Failed to fetch token");
    }
  }

  protected async refreshAccessToken() {
    if (this.refreshPromise) return;

    if (!this.refreshToken) {
      throw this.createError(
        new Error("No refresh token available. Re-authentication required."),
        "No refresh token available. Re-authentication required.",
      );
    }

    this.refreshPromise = this.postToken({
      grant_type: "refresh_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      refresh_token: this.refreshToken,
    })
      .then((data) => {
        ((this.token = data.access_token),
          (this.refreshToken = data.refresh_token));
        return data;
      })
      .finally(() => {
        this.refreshPromise = undefined;
      })
      .catch((e) => {
        throw this.createError(e, "Failed to get refresh token", 401);
      });
  }
  protected requiresUserAuth() {
    return !this.token && !this.refreshToken;
  }

  async getToken(code: string) {
    const data = await this.postToken({
      grant_type: "authorization_code",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    this.token = data.access_token;
    this.refreshToken = data.refresh_token;

    return { token: data.access_token, refreshToken: data.refresh_token };
  }
}
