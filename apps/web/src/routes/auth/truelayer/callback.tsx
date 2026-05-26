import { getToken } from "@clerk/react";
import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { z } from "zod";

const querySchema = z.object({
  code: z.string(),
});

export const Route = createFileRoute("/auth/truelayer/callback")({
  validateSearch: querySchema,
  loaderDeps: ({ search: { code } }) => ({ code }),
  loader: async ({ deps: { code } }) => {
    const token = await getToken();

    if (!token) {
      throw redirect({
        to: "/",
      });
    }

    const response = await fetch(`/api/truelayer/auth/callback?code=${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 400) {
      const { error } = (await response.json()) as { error: string };

      throw redirect({
        to: "/auth/truelayer/error",
        search: { error },
      });
    }

    throw redirect({
      to: "/dashboard",
    });
  },
});
