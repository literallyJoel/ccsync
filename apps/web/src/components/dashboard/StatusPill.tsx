type Props = {
  status: "loading" | "connected" | "disconnected" | "error";
};

const config = {
  loading: {
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-300",
    label: "Checking…",
  },
  connected: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    label: "Connected",
  },
  disconnected: {
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    label: "Not linked",
  },
  error: {
    dot: "bg-red-400",
    text: "text-red-300",
    label: "Error",
  },
};

const StatusPill = ({ status }: Props) => {
  const { dot, text, label } = config[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

export default StatusPill;
