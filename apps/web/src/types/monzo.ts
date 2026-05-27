export type MonzoAccount = {
  id: string;
  assets: {
    image_url: string;
  };
  is_flex: boolean;
  owner_type: string;
};

export type MonzoPot = {
  id: string;
  name: string;
  style: string;
  cover_image_url: string;
};

export type MonzoConnectedResponse = {
  pot: MonzoPot;
  account: MonzoAccount;
};

export type ConnectionState<T> =
  | { status: "loading" }
  | { status: "connected"; data: T }
  | { status: "disconnected" }
  | { status: "error"; message: string };

export type LinkStep =
  | { step: "idle" }
  | { step: "loadingAccounts" }
  | { step: "pickingAccount"; accounts: MonzoAccount[] }
  | { step: "loadingPots"; accounts: MonzoAccount[]; accountId: string }
  | { step: "pickingPot"; accounts: MonzoAccount[]; pots: MonzoPot[] }
  | { step: "saving"; accountId: string; potId: string };
