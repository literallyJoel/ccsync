interface SelectionButtonProps {
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const SelectionButton = ({
  isSelected,
  disabled,
  onClick,
  children,
}: SelectionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex flex-row items-center gap-2.5 rounded-lg border p-3 text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    style={{
      backgroundColor: isSelected
        ? "rgba(255,79,64,0.12)"
        : "rgba(255,255,255,0.03)",
      borderColor: isSelected
        ? "rgba(255,79,64,0.5)"
        : "rgba(255,255,255,0.08)",
    }}
    onMouseEnter={(e) => {
      if (isSelected) return;
      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
    }}
    onMouseLeave={(e) => {
      if (isSelected) return;
      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
    }}
  >
    {children}
    {isSelected && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ff4f40"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

export default SelectionButton;
