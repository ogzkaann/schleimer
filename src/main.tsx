import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  // Engine sanity checks, logged to the console. Stripped from prod builds.
  import("./game/validate").then((m) => m.runDevValidation());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
