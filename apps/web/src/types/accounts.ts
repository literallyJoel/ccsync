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

export type TrueLayerAccount = {
  account_id: string;
  display_name: string;
  provider: string;
};
