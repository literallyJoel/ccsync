import { Show, UserButton } from "@clerk/react";

const Header = () => {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: "#091723",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo / Wordmark */}
        <div className="flex items-center gap-2.5">
          {/* Card + sync icon lockup */}
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff4f40"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff4f40"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {/* Monzo "M" approximated as a phone/app icon */}
              <rect width="14" height="20" x="5" y="2" rx="2" />
              <path d="M12 18h.01" />
            </svg>
          </div>

          <span className="text-base font-bold tracking-tight text-white">
            CC
            <span style={{ color: "#ff4f40" }}>Sync</span>
          </span>
        </div>

        {/* Right side */}
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            {/* Clerk UserButton — avatar + dropdown with sign-out */}
            <UserButton />
          </div>
        </Show>
      </div>
    </header>
  );
};

export default Header;
