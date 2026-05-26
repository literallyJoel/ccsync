import { createFileRoute } from "@tanstack/react-router";
import AuthError from "apps/web/src/components/auth/Error";
import { z } from "zod";

const QuerySchema = z.object({
  error: z.string(),
});

export const Route = createFileRoute("/auth/monzo/error")({
  component: RouteComponent,
  validateSearch: QuerySchema,
});

function RouteComponent() {
  const { error } = Route.useSearch();
  return <AuthError provider="Monzo" error={error} />;
}
