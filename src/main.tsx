import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  // Engine sanity checks, logged to the console. Stripped from prod builds.
  import("./game/validate").then((m) => m.runDevValidation());
  // Expose the live stores for dev tooling (screenshot script, console poking).
  void Promise.all([
    import("./store/gameStore"),
    import("./ai/aiSettings"),
    import("./store/runHistory"),
  ]).then(
    ([game, ai, history]) => {
      (window as unknown as Record<string, unknown>).__schleimer = {
        game: game.useGameStore,
        ai: ai.useAiSettings,
        history: history.useRunHistory,
      };
    },
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
