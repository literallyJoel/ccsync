export type Secret = {
  name: string;
  value: {
    raw: string;
    computed: string;
    note: string;
  };
};
