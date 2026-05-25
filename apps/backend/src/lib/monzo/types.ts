export type ClientConstructorProps = {
    clientId?: string;
    redirectUri?: string;
    clientSecret?: string;
    token?: string;
    refreshToken?: string;
}

export type Account = {
    id: string,
    description: string,
    created: string
};

export type GetAccountsResponse = {
    accounts: Account[]
};

export type Pot = {
    id: string,
    name: string,
    style: string,
    balance: number,
    currency: string,
    created: string,
    updated: string,
    deleted: boolean,
}

export type GetPotsResponse = {
    pots: Pot[]
}