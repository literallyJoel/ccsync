import { LinkStep, MonzoAccount } from "apps/web/src/types/monzo";
import SelectionButton from "./SelectionButton";
import SkeletonGrid from "./SkeletonGrid";

interface AccountPickerProps {
  accounts: MonzoAccount[];
  selectedAccount: string;
  isLoadingPots: boolean;
  linkStep: LinkStep;
  onSelect: (accountId: string) => void;
}

const AccountPicker = ({
  accounts,
  selectedAccount,
  isLoadingPots,
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
            disabled={isLoadingPots}
            onClick={() => onSelect(account.id)}
          >
            <img
              src={account.assets.image_url}
              width={28}
              height={28}
              className="rounded-full border border-white/10 shrink-0"
              alt=""
            />
            <span className="text-xs font-semibold text-white leading-tight">
              {account.owner_type}
              {account.is_flex && (
                <span
                  className="block font-normal"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Flex
                </span>
              )}
            </span>
          </SelectionButton>
        );
      })}
    </div>

    {isLoadingPots && <SkeletonGrid label="Pot" count={4} />}
  </div>
);

export default AccountPicker;
