import type { TrueLayerAccount } from "../../../types/truelayer";
import SelectionButton from "../shared/SelectionButton";

interface AccountPickerProps {
  accounts: TrueLayerAccount[];
  selectedAccount: string;
  onSelect: (accountId: string) => void;
}

const AccountPicker = ({
  accounts,
  selectedAccount,
  onSelect,
}: AccountPickerProps) => (
  <div className="flex flex-col gap-2">
    <p
      className="text-xs font-medium"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      Account
    </p>
    <div className="grid grid-cols-2 gap-3">
      {accounts.map((account) => {
        const isSelected = selectedAccount === account.id;
        return (
          <SelectionButton
            key={account.id}
            isSelected={isSelected}
            accentColor="#1a6ef5"
            selectedBackgroundColor="rgba(26,110,245,0.12)"
            selectedBorderColor="rgba(26,110,245,0.5)"
            onClick={() => onSelect(account.id)}
          >
            {account.providerLogo && (
              <img
                src={account.providerLogo}
                width={28}
                height={28}
                className="rounded-full border border-white/10 bg-white shrink-0"
                alt=""
              />
            )}
            <span className="text-xs font-semibold text-white leading-tight">
              {account.displayName}
              <span
                className="block font-normal"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {account.providerName}
              </span>
            </span>
          </SelectionButton>
        );
      })}
    </div>
  </div>
);

export default AccountPicker;
