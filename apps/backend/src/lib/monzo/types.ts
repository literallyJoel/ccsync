export type ClientConstructorProps = {
  clientId?: string;
  redirectUri?: string;
  clientSecret?: string;
  token?: string;
  refreshToken?: string;
  userId: string;
};

export type Account = {
  id: string;
  description: string;
  created: string;
  is_flex: boolean;
  owner_type: string;
  assets: {
    image_url: string;
  };
};

export type GetAccountsResponse = {
  accounts: Account[];
};

export type Pot = {
  id: string;
  name: string;
  style: string;
  balance: number;
  currency: string;
  created: string;
  updated: string;
  deleted: boolean;
  cover_image_url: string;
};

export type GetPotsResponse = {
  pots: Pot[];
};
