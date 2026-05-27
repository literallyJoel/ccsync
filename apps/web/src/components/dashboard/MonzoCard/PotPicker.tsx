import { MonzoPot } from "apps/web/src/types/monzo";
import SelectionButton from "./SelectionButton";

interface PotPickerProps {
  pots: MonzoPot[];
  selectedPot: string;
  onSelect: (potId: string) => void;
}

const PotPicker = ({ pots, selectedPot, onSelect }: PotPickerProps) => (
  <div className="flex flex-col gap-2">
    <p
      className="text-xs font-medium"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      Pot
    </p>
    <div className="grid grid-cols-2 gap-3">
      {pots.map((pot) => {
        const isSelected = selectedPot === pot.id;
        return (
          <SelectionButton
            key={pot.id}
            isSelected={isSelected}
            onClick={() => onSelect(pot.id)}
          >
            <img
              src={pot.cover_image_url}
              width={50}
              height={50}
              className="rounded-full border border-white/10 shrink-0"
              alt=""
            />
            <span className="text-xs font-semibold text-white leading-tight">
              {pot.name}
            </span>
          </SelectionButton>
        );
      })}
    </div>
  </div>
);

export default PotPicker;
