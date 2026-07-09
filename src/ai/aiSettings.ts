/**
 * AI settings store — mode, BYOK key, model, connection status.
 *
 * The key lives only in this browser's localStorage. Connection status is
 * intentionally NOT persisted: every session starts honest at "untested".
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { testGeminiConnection } from "./geminiClient";

export type AiMode = "mock" | "ai";
export type ConnectionStatus = "untested" | "testing" | "connected" | "failed";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export interface AiSettingsStore {
  mode: AiMode;
  apiKey: string;
  model: string;
  status: ConnectionStatus;
  /** Short user-safe error shown under the status. Never contains the key. */
  statusDetail: string | null;

  setMode: (mode: AiMode) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  testConnection: () => Promise<void>;
}

export const useAiSettings = create<AiSettingsStore>()(
  persist(
    (set, get) => ({
      mode: "mock",
      apiKey: "",
      model: DEFAULT_GEMINI_MODEL,
      status: "untested",
      statusDetail: null,

      setMode: (mode) => set({ mode }),
      setApiKey: (apiKey) => set({ apiKey, status: "untested", statusDetail: null }),
      setModel: (model) => set({ model, status: "untested", statusDetail: null }),

      testConnection: async () => {
        const apiKey = get().apiKey.trim();
        const model = get().model.trim() || DEFAULT_GEMINI_MODEL;
        if (!apiKey) {
          set({ status: "failed", statusDetail: "Enter an API key first." });
          return;
        }
        set({ status: "testing", statusDetail: null });
        const result = await testGeminiConnection(apiKey, model);
        if (result.ok) {
          set({ status: "connected", statusDetail: null });
        } else {
          set({ status: "failed", statusDetail: result.error });
        }
      },
    }),
    {
      name: "schleimer-ai-settings",
      partialize: (state) => ({
        mode: state.mode,
        apiKey: state.apiKey,
        model: state.model,
      }),
    },
  ),
);

/** True when the game should attempt AI dialogue at all. */
export function aiBossEnabled(): boolean {
  const { mode, apiKey } = useAiSettings.getState();
  return mode === "ai" && apiKey.trim().length > 0;
}
