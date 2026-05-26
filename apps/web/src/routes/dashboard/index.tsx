import { createFileRoute } from "@tanstack/react-router";
import MonzoCard from "../../components/dashboard/MonzoCard";
import TrueLayerCard from "../../components/dashboard/TrueLayerCard";
import { useConnectedAccounts } from "../../hooks/useConnectedAccounts";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const { monzo, trueLayer, lastSync } = useConnectedAccounts();

  const bothConnected =
    monzo.status === "connected" && trueLayer.status === "connected";

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-8">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Manage your linked accounts and sync status.
          </p>
        </div>

        {/* Sync status banner — only show when both connected */}
        {bothConnected && (
          <div
            className="flex items-center justify-between rounded-xl border px-5 py-4"
            style={{
              backgroundColor: "#0d2035",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              {/* Pulsing dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  Sync active
                </span>
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {lastSync
                    ? `Last synced ${lastSync.toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}`
                    : "No sync recorded yet"}
                </span>
              </div>
            </div>

            {/* Sync flow indicator */}
            <div
              className="hidden sm:flex items-center gap-2 text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <span className="font-medium text-white">TrueLayer</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span className="font-medium" style={{ color: "#ff4f40" }}>
                Monzo
              </span>
            </div>
          </div>
        )}

        {/* Not fully set up warning */}
        {!bothConnected &&
          monzo.status !== "loading" &&
          trueLayer.status !== "loading" && (
            <div
              className="flex items-start gap-3 rounded-xl border px-5 py-4"
              style={{
                backgroundColor: "rgba(255,79,64,0.07)",
                borderColor: "rgba(255,79,64,0.2)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff4f40"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-white">
                  Setup incomplete
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Link both accounts below to start syncing transactions.
                </p>
              </div>
            </div>
          )}

        {/* Account cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TrueLayerCard state={trueLayer} />
          <MonzoCard state={monzo} />
        </div>
      </div>
    </div>
  );
}
