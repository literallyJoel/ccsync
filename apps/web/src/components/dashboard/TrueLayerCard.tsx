import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import type {
  TrueLayerLinkStep,
  TrueLayerAccount,
  TrueLayerConnectedResponse,
} from "../../types/truelayer";
import type { ConnectionState } from "../../types/monzo";
import StatusPill from "./StatusPill";
import Detail from "./shared/Detail";
import SkeletonGrid from "./shared/SkeletonGrid";
import AccountPicker from "./TrueLayerCard/AccountPicker";

type Props = {
  state: ConnectionState<TrueLayerConnectedResponse>;
  startSelecting?: boolean;
};

const TrueLayerCard = ({ state, startSelecting = false }: Props) => {
  const [linkStep, setLinkStep] = useState<TrueLayerLinkStep>({
    step: "idle",
  });
  const [selectedAccount, setSelectedAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const attemptedAutoSelect = useRef(false);
  const { getToken } = useAuth();

  const handleConnect = async () => {
    const token = await getToken();
    const response = await fetch("/api/truelayer/auth", {
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
      const response = await fetch("/api/truelayer/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(await response.text());
      const accounts = (await response.json()) as TrueLayerAccount[];
      setLinkStep({ step: "pickingAccount", accounts });
    } catch {
      setError("Failed to fetch accounts.");
      setLinkStep({ step: "idle" });
    }
  };

  const handleSave = async () => {
    const accounts =
      linkStep.step === "pickingAccount" ? linkStep.accounts : [];
    const account = accounts.find((account) => account.id === selectedAccount);
    if (!account) return;

    setLinkStep({ step: "saving", accountId: selectedAccount });
    try {
      const token = await getToken();
      const response = await fetch("/api/truelayer/connected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: account.id,
          accountName: account.displayName,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      window.location.reload();
    } catch {
      setError("Failed to save account.");
      setLinkStep({ step: "pickingAccount", accounts });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
            style={{ backgroundColor: "#1a6ef5" }}
          >
            TL
          </div>
          <div>
            <p className="font-semibold text-white text-sm">TrueLayer</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              Credit card source
            </p>
          </div>
        </div>
        <StatusPill status={state.status} />
      </div>

      {/* Body */}
      {state.status === "loading" && (
        <div className="h-8 w-48 animate-pulse rounded-md bg-white/5" />
      )}

      {state.status === "connected" && (
        <div className="flex flex-col gap-1.5">
          <Detail
            label="Account"
            value={state.data.account.displayName}
            image={state.data.account.providerLogo}
          />
          <Detail label="Provider" value={state.data.account.providerName} />
        </div>
      )}

      {state.status === "disconnected" && linkStep.step === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Link a credit card via TrueLayer to sync transactions into Monzo.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleConnect}
            className="w-fit rounded-lg px-4 py-2 text-sm cursor-pointer font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1a6ef5" }}
          >
            Connect Credit Card
          </button>
        </div>
      )}

      {state.status === "disconnected" &&
        linkStep.step === "loadingAccounts" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading accounts...
            </p>
            <SkeletonGrid label="" count={2} />
          </div>
        )}

      {state.status === "disconnected" &&
        linkStep.step === "pickingAccount" && (
          <div className="flex flex-col gap-4">
            <AccountPicker
              accounts={linkStep.accounts}
              selectedAccount={selectedAccount}
              onSelect={setSelectedAccount}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleSave}
              disabled={!selectedAccount}
              className="w-fit rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: "#1a6ef5" }}
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

      {state.status === "error" && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}
    </div>
  );
};

export default TrueLayerCard;
