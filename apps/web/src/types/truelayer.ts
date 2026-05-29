export type TrueLayerConnectedResponse = {
  account: {
    id: string;
    providerName: string;
    providerLogo?: string;
    displayName: string;
  };
};

export type TrueLayerAccount = {
  id: string;
  displayName: string;
  providerName: string;
  providerLogo?: string;
};

export type TrueLayerLinkStep =
  | { step: "idle" }
  | { step: "loadingAccounts" }
  | { step: "pickingAccount"; accounts: TrueLayerAccount[] }
  | { step: "saving"; accountId: string };
