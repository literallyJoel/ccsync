export type ClientConstructorProps = {
  clientId?: string;
  redirectUri?: string;
  clientSecret?: string;
  token?: string;
  refreshToken?: string;
  sandbox?: boolean;
  userId: string;
};

export type Account = {
  update_timestamp: string;
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  account_number: {
    iban: string;
    swift_bic: string;
    number: string;
    sort_code: string;
  };
  provider: {
    display_name: string;
    provider_id: string;
    logo_uri: string;
  };
};

export type GetAccountResponse = {
  results: Account[];
  status: string;
};

export type Transaction = {
  timestamp: string;
  description: string;
  transaction_type: string;
  transaction_category: string;
  transaction_classification: string[];
  amount: number;
  currency: string;
  transaction_id: string;
  provider_transaction_id: string;
  normalised_provider_transaction_id: string;
  status: "pending" | "settled";
  meta: {
    provider_category: string;
    transaction_type: string;
    provider_id: string;
  };
};

export type GetTransactionsResponse = {
  results: Transaction[];
  status: string;
};
