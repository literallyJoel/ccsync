import { Show, SignIn, SignOutButton } from "@clerk/react";

const App = () => {
  return (
    <div>
      <Show when="signed-out">
        <SignIn />
      </Show>
      <Show when="signed-in">
        <SignOutButton />
      </Show>
    </div>
  );
};

export default App;
