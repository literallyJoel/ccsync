export type MonzoConnectedResponse = {
  pot: { id: string; name: string; style: string };
  account: { id: string; description: string };
};

export type TrueLayerConnectedResponse = {
  account: {
    id: string;
    provider: string;
    displayName: string;
  };
};

export type MonzoAccount = {
  id: string;
  description: string;
};

export type MonzoPot = {
  id: string;
  name: string;
  style: string;
};

export type TrueLayerAccount = {
  account_id: string;
  display_name: string;
  provider: string;
};
