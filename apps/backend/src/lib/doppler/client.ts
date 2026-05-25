import axios from "axios";
import { env } from "../../env";
import { Secret } from "./types";

export class DopplerClient {
  protected readonly apiClient;
  protected readonly config: string;
  protected readonly project: string;

  constructor(token?: string, project?: string, config?: string) {
    this.apiClient = axios.create({
      baseURL: "https://api.doppler.com/v3/configs/config",
    });

    const _token = token || env.DOPPLER_TOKEN;

    this.apiClient.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${_token}`;
      return config;
    });

    this.project = project || env.DOPPLER_PROJECT;
    this.config = config || env.DOPPLER_CONFIG;
  }

  async get(key: string): Promise<Secret | undefined> {
    const response = await this.apiClient.get("/secret", {
      params: {
        project: this.project,
        config: this.config,
        name: key,
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 200 && response.data) {
      return response.data;
    }
  }

  async set(
    input: { key: string; value: string } | { key: string; value: string }[],
  ): Promise<boolean> {
    const entries = Array.isArray(input) ? input : [input];

    const secrets = Object.fromEntries(
      entries.map(({ key, value }) => [key, value]),
    );

    const response = await this.apiClient.post("/secrets", {
      project: this.project,
      config: this.config,
      secrets,
    });

    return response.status === 200;
  }

  async getAll(
    includeManagedSecrets?: boolean,
  ): Promise<
    Record<
      string,
      Secret["value"] & { rawVisibility: string; computedVisiblity: string }
    >
  > {
    const response = await this.apiClient.get("/secrets", {
      params: {
        project: this.project,
        config: this.config,
        include_managed_secrets: includeManagedSecrets ? "true" : "false",
      },
    });

    if (response.status === 200 && response.data?.secrets) {
      return response.data.secrets;
    }

    return {};
  }

  async delete(key: string): Promise<boolean> {
    const response = await this.apiClient.delete("/secret", {
      params: {
        project: this.project,
        conifg: this.config,
        name: key,
      },
      headers: {
        Accept: "application/json",
      },
    });

    return response.status === 204;
  }
}
