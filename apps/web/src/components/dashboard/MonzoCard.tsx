import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import {
  ConnectionState,
  LinkStep,
  MonzoAccount,
  MonzoConnectedResponse,
  MonzoPot,
} from "../../types/monzo";
import StatusPill from "./StatusPill";
import Detail from "./shared/Detail";
import SkeletonGrid from "./shared/SkeletonGrid";
import AccountPicker from "./MonzoCard/AccountPicker";
import PotPicker from "./MonzoCard/PotPicker";

interface MonzoCardProps {
  state: ConnectionState<MonzoConnectedResponse>;
  startSelecting?: boolean;
}

const MonzoCard = ({ state, startSelecting = false }: MonzoCardProps) => {
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
          <Detail
            label="Account"
            value={`${state.data.account.owner_type}${state.data.account.is_flex ? " (Flex)" : ""}`}
            image={state.data.account.assets.image_url}
          />
          <Detail
            label="Pot"
            value={state.data.pot.name}
            image={state.data.pot.cover_image_url}
          />
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <p className="text-xs text-red-400">{state.message}</p>
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

      {/* Loading accounts */}
      {state.status === "disconnected" &&
        linkStep.step === "loadingAccounts" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading accounts...
            </p>
            <SkeletonGrid label="" count={2} />
          </div>
        )}

      {/* Account + pot picking */}
      {state.status === "disconnected" && isPickingStep && (
        <div className="flex flex-col gap-4">
          <AccountPicker
            accounts={linkStep.accounts}
            selectedAccount={selectedAccount}
            isLoadingPots={linkStep.step === "loadingPots"}
            linkStep={linkStep}
            onSelect={handleAccountChange}
          />

          {linkStep.step === "pickingPot" && (
            <PotPicker
              pots={linkStep.pots}
              selectedPot={selectedPot}
              onSelect={setSelectedPot}
            />
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

export default MonzoCard;
