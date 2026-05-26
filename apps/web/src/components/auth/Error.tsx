import { Link } from "@tanstack/react-router";

type Props = {
  provider: "Monzo" | "TrueLayer";
  error: string | null;
};

const ERROR_MAP: Record<string, { title: string; description: string }> = {
  missing_code: {
    title: "Authorisation failed",
    description:
      "No authorisation code was returned by the provider. This usually means you declined the connection request or the link expired.",
  },
  missing_token: {
    title: "Token exchange failed",
    description:
      "An authorisation code was received but we couldn't exchange it for an access token. Please try again.",
  },
  missing_refresh: {
    title: "Refresh token missing",
    description:
      "Authentication succeeded but no refresh token was issued. This can happen if the connection was already authorised previously — try revoking access in your provider settings and reconnecting.",
  },
};

const FALLBACK = {
  title: "Something went wrong",
  description:
    "An unexpected error occurred during authentication. Please try again.",
};

const PROVIDER_ACCENT: Record<"Monzo" | "TrueLayer", string> = {
  Monzo: "#ff4f40",
  TrueLayer: "#1a6ef5",
};

const AuthError = ({ provider, error }: Props) => {
  const { title, description } = error
    ? (ERROR_MAP[error] ?? FALLBACK)
    : FALLBACK;

  const accent = PROVIDER_ACCENT[provider];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#091723" }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Card */}
        <div
          className="rounded-xl border p-6 flex flex-col gap-5"
          style={{
            backgroundColor: "#0d2035",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Provider badge + error icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-xs"
                style={{ backgroundColor: accent }}
              >
                {provider === "Monzo" ? "M" : "TL"}
              </div>
              <span className="text-sm font-semibold text-white">
                {provider}
              </span>
            </div>

            {/* Error icon */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,79,64,0.12)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff4f40"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-base font-bold text-white">{title}</h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {description}
            </p>
          </div>

          {/* Reason code — useful for debugging */}
          {error && (
            <div
              className="rounded-lg px-3 py-2.5 flex items-center gap-2"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Error code
              </span>
              <code
                className="text-xs font-mono"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {error}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white text-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: accent }}
            >
              Try again
            </Link>
            <Link
              to="/"
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold text-center transition-colors hover:bg-white/5"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Go to dashboard
            </Link>
          </div>
        </div>

        {/* Footer hint */}
        <p
          className="text-center text-xs"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          If this keeps happening, try revoking access in your{" "}
          {provider === "Monzo" ? "Monzo app" : "provider's settings"} and
          reconnecting.
        </p>
      </div>
    </div>
  );
};

export default AuthError;
