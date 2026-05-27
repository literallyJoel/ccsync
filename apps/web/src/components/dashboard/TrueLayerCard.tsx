import { useState } from "react";
import { useAuth } from "@clerk/react";
import type {
  TrueLayerAccount,
  TrueLayerConnectedResponse,
} from "../../types/truelayer";
import StatusPill from "./StatusPill";

type ConnectionState<T> =
  | { status: "loading" }
  | { status: "connected"; data: T }
  | { status: "disconnected" }
  | { status: "error"; message: string };

type Props = {
  state: ConnectionState<TrueLayerConnectedResponse>;
};

const TrueLayerCard = ({ state }: Props) => {
  const [accounts, setAccounts] = useState<TrueLayerAccount[] | null>(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleConnect = async () => {
    const token = await getToken();
    const response = await fetch("/api/truelayer/auth", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { url } = await response.json();

    window.location.href = url.toString();
  };

  const handlePickAccount = async () => {
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/truelayer/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccounts(data);
    } catch {
      setError("Failed to fetch accounts.");
    }
  };

  const handleSave = async () => {
    const account = accounts?.find((a) => a.account_id === selected);
    if (!account) return;
    setSaving(true);
    try {
      const token = await getToken();
      await fetch("/api/truelayer/connected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: account.account_id,
          accountName: account.display_name,
        }),
      });
      window.location.reload();
    } catch {
      setError("Failed to save account.");
      setSaving(false);
    }
  };

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
          <Detail label="Account" value={state.data.account.displayName} />
          <Detail label="Provider" value={state.data.account.provider} />
        </div>
      )}

      {state.status === "disconnected" && !accounts && (
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

      {state.status === "disconnected" && accounts && !saving && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Account
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm text-white outline-none"
              style={{
                backgroundColor: "#091723",
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.account_id} value={a.account_id}>
                  {a.display_name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSave}
            disabled={!selected}
            className="w-fit rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "#1a6ef5" }}
          >
            Save
          </button>
        </div>
      )}

      {saving && (
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Saving…
        </p>
      )}

      {state.status === "error" && (
        <p className="text-xs text-red-400">{state.message}</p>
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

export default TrueLayerCard;
