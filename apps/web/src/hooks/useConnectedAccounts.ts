import { useEffect, useState } from "react";
import type {
  MonzoConnectedResponse,
  TrueLayerConnectedResponse,
} from "../types/accounts";

type ConnectionState<T> =
  | { status: "loading" }
  | { status: "connected"; data: T }
  | { status: "disconnected" }
  | { status: "error"; message: string };

export function useConnectedAccounts() {
  const [monzo, setMonzo] = useState<ConnectionState<MonzoConnectedResponse>>({
    status: "loading",
  });

  const [trueLayer, setTrueLayer] = useState<
    ConnectionState<TrueLayerConnectedResponse>
  >({ status: "loading" });

  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const stored = localStorage.getItem("ccsync:lastSync");
    return stored ? new Date(stored) : null;
  });

  useEffect(() => {
    fetch("/api/monzo/connected")
      .then(async (res) => {
        if (res.status === 404) {
          setMonzo({ status: "disconnected" });
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMonzo({ status: "connected", data });
      })
      .catch((e) => setMonzo({ status: "error", message: e.message }));

    fetch("/api/truelayer/connected")
      .then(async (res) => {
        if (res.status === 404) {
          setTrueLayer({ status: "disconnected" });
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTrueLayer({ status: "connected", data });
      })
      .catch((e) => setTrueLayer({ status: "error", message: e.message }));
  }, []);

  return { monzo, trueLayer, lastSync };
}
