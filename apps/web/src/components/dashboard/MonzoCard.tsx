import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import type {
  MonzoAccount,
  MonzoConnectedResponse,
  MonzoPot,
} from "../../types/accounts";
import StatusPill from "./StatusPill";

type ConnectionState<T> =
  | { status: "loading" }
  | { status: "connected"; data: T }
  | { status: "disconnected" }
  | { status: "error"; message: string };

type Props = {
  state: ConnectionState<MonzoConnectedResponse>;
  startSelecting?: boolean;
};

type LinkStep =
  | { step: "idle" }
  | { step: "loadingAccounts" }
  | { step: "pickingAccount"; accounts: MonzoAccount[] }
  | { step: "loadingPots"; accounts: MonzoAccount[]; accountId: string }
  | { step: "pickingPot"; accounts: MonzoAccount[]; pots: MonzoPot[] }
  | { step: "saving"; accountId: string; potId: string };

const MonzoCard = ({ state, startSelecting = false }: Props) => {
  const [linkStep, setLinkStep] = useState<LinkStep>({ step: "idle" });
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPot, setSelectedPot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const attemptedAutoSelect = useRef(false);
  const { getToken } = useAuth();

  const handleConnect = async () => {
    const token = await getToken();
    const response = await fetch("/api/monzo/auth", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { url } = await response.json();
    window.location.href = url.toString();
  };

  const handlePickAccounts = async () => {
    setError(null);
    setLinkStep({ step: "loadingAccounts" });
    try {
      const token = await getToken();
      const response = await fetch("/api/monzo/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      const accounts = (await response.json()) as MonzoAccount[];
      setLinkStep({ step: "pickingAccount", accounts });
    } catch {
      setError("Failed to fetch accounts.");
      setLinkStep({ step: "idle" });
    }
  };

  const handleAccountChange = async (accountId: string) => {
    setSelectedAccount(accountId);
    setSelectedPot("");

    const accounts =
      linkStep.step === "pickingAccount" || linkStep.step === "pickingPot"
        ? linkStep.accounts
        : [];

    setError(null);
    setLinkStep({ step: "loadingPots", accounts, accountId });

    try {
      const token = await getToken();
      const response = await fetch(
        `/api/monzo/pots?accountId=${encodeURIComponent(accountId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error(await response.text());
      const pots = (await response.json()) as MonzoPot[];
      setLinkStep({ step: "pickingPot", accounts, pots });
    } catch {
      setError("Failed to fetch pots.");
      setLinkStep({ step: "pickingAccount", accounts });
    }
  };

  const handleSave = async () => {
    if (!selectedAccount || !selectedPot) return;
    setLinkStep({
      step: "saving",
      accountId: selectedAccount,
      potId: selectedPot,
    });
    try {
      const token = await getToken();
      const response = await fetch("/api/monzo/connected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          potId: selectedPot,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      window.location.reload();
    } catch {
      setError("Failed to save account.");
      setLinkStep({ step: "idle" });
    }
  };

  useEffect(() => {
    if (
      startSelecting &&
      state.status === "disconnected" &&
      linkStep.step === "idle" &&
      !attemptedAutoSelect.current
    ) {
      attemptedAutoSelect.current = true;
      void handlePickAccounts();
    }
  }, [startSelecting, state.status, linkStep.step]);

  const isPickingStep =
    linkStep.step === "pickingAccount" ||
    linkStep.step === "loadingPots" ||
    linkStep.step === "pickingPot";

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{
        backgroundColor: "#0d2035",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
            style={{ backgroundColor: "#ff4f40" }}
          >
            M
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Monzo</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Destination account &amp; pot
            </p>
          </div>
        </div>
        <StatusPill status={state.status} />
      </div>

      {/* Loading initial state */}
      {state.status === "loading" && (
        <div className="h-8 w-48 animate-pulse rounded-md bg-white/5" />
      )}

      {/* Connected */}
      {state.status === "connected" && (
        <div className="flex flex-col gap-1.5">
          <Detail label="Account" value={state.data.account.description} />
          <Detail label="Pot" value={state.data.pot.name} />
        </div>
      )}

      {/* Idle — prompt to connect */}
      {state.status === "disconnected" && linkStep.step === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Connect your Monzo account to use it as the sync destination.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleConnect}
            className="w-fit rounded-lg px-4 py-2 text-sm cursor-pointer font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#ff4f40" }}
          >
            Connect Monzo
          </button>
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}

      {/* Loading accounts */}
      {state.status === "disconnected" &&
        linkStep.step === "loadingAccounts" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading accounts...
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-white/5"
                />
              ))}
            </div>
          </div>
        )}

      {/* Account + pot picking */}
      {state.status === "disconnected" && isPickingStep && (
        <div className="flex flex-col gap-4">
          {/* Step label */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Account
            </p>
            <div className="grid grid-cols-2 gap-3">
              {linkStep.accounts.map((account) => {
                const isSelected = selectedAccount === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => handleAccountChange(account.id)}
                    disabled={linkStep.step === "loadingPots"}
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
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.07)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      if (isSelected) return;
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.08)";
                    }}
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
              })}
            </div>
          </div>

          {/* Loading pots skeleton */}
          {linkStep.step === "loadingPots" && (
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Pot
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-white/5"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pot picker */}
          {linkStep.step === "pickingPot" && (
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Pot
              </p>
              <div className="grid grid-cols-2 gap-3">
                {linkStep.pots.map((pot) => {
                  const isSelected = selectedPot === pot.id;
                  return (
                    <button
                      key={pot.id}
                      onClick={() => setSelectedPot(pot.id)}
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
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.07)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        if (isSelected) return;
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.03)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.08)";
                      }}
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
                })}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleSave}
            disabled={
              linkStep.step !== "pickingPot" || !selectedAccount || !selectedPot
            }
            className="w-fit rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: "#ff4f40" }}
          >
            Save
          </button>
        </div>
      )}

      {/* Saving */}
      {linkStep.step === "saving" && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Saving...
        </p>
      )}
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <span
      className="w-16 shrink-0 text-xs"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {label}
    </span>
    <span className="text-xs font-medium text-white">{value}</span>
  </div>
);

export default MonzoCard;
