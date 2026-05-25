export type BaseClientConstructorProps = {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    apiBaseUrl: string;
    token?: string;
    refreshToken?: string;
};

export type GetTokenResponse = {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
};