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
      const response = await fetch("/api/monzo/accounts/get", {
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

    if (!accountId) {
      setLinkStep({ step: "pickingAccount", accounts });
      return;
    }

    setError(null);
    setLinkStep({ step: "loadingPots", accounts, accountId });

    try {
      const token = await getToken();
      const response = await fetch(
        `/api/monzo/pots/get?accountId=${encodeURIComponent(accountId)}`,
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

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{
        backgroundColor: "#0d2035",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
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

      {state.status === "loading" && (
        <div className="h-8 w-48 animate-pulse rounded-md bg-white/5" />
      )}

      {state.status === "connected" && (
        <div className="flex flex-col gap-1.5">
          <Detail label="Account" value={state.data.account.description} />
          <Detail label="Pot" value={state.data.pot.name} />
        </div>
      )}

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

      {state.status === "error" && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}

      {state.status === "disconnected" &&
        linkStep.step === "loadingAccounts" && (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Loading Monzo accounts...
          </p>
        )}

      {state.status === "disconnected" &&
        (linkStep.step === "pickingAccount" ||
          linkStep.step === "loadingPots" ||
          linkStep.step === "pickingPot") && (
          <div className="flex flex-col gap-3">
            <Select
              label="Account"
              value={selectedAccount}
              onChange={handleAccountChange}
              disabled={linkStep.step === "loadingPots"}
              options={linkStep.accounts.map((a) => ({
                value: a.id,
                label: a.description,
              }))}
            />

            {linkStep.step === "loadingPots" && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Loading pots...
              </p>
            )}

            {linkStep.step === "pickingPot" && (
              <Select
                label="Pot"
                value={selectedPot}
                onChange={setSelectedPot}
                options={linkStep.pots.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleSave}
              disabled={
                linkStep.step !== "pickingPot" || !selectedAccount || !selectedPot
              }
              className="w-fit rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "#ff4f40" }}
            >
              Save
            </button>
          </div>
        )}

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

const Select = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-lg border px-3 py-2 text-sm text-white outline-none focus:ring-2 disabled:opacity-60"
      style={{
        backgroundColor: "#091723",
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      <option value="">Select {label.toLowerCase()}...</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default MonzoCard;
