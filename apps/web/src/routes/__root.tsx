import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn, useAuth } from "@clerk/react";
import FullPageSpinner from "../components/loading/FullPageSpinner";
import Header from "../components/Header";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="bg-gray-900">
        <FullPageSpinner />;
      </main>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <main className="bg-gray-900">
      <Header />
      <Outlet />
    </main>
  );
}
