import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => {
    throw redirect({
      to: "/dashboard",
    });
  },
});

function RouteComponent() {
  return <div>Hello "/"!</div>;
}
