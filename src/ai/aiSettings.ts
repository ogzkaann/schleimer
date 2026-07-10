/**
 * AI settings store — mode, provider, BYOK key, model, connection status.
 *
 * The key lives only in this browser's localStorage. Connection status is
 * intentionally NOT persisted: every session starts honest at "untested".
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { testProviderConnection, type AiProvider } from "./aiProvider";

export type AiMode = "mock" | "ai";
export type ConnectionStatus = "untested" | "testing" | "connected" | "failed";
export type { AiProvider } from "./aiProvider";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export function defaultModelFor(provider: AiProvider): string {
  return provider === "groq" ? DEFAULT_GROQ_MODEL : DEFAULT_GEMINI_MODEL;
}

export interface AiSettingsStore {
  mode: AiMode;
  provider: AiProvider;
  apiKey: string;
  model: string;
  status: ConnectionStatus;
  /** Short user-safe error shown under the status. Never contains the key. */
  statusDetail: string | null;

  setMode: (mode: AiMode) => void;
  setProvider: (provider: AiProvider) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  testConnection: () => Promise<void>;
}

export const useAiSettings = create<AiSettingsStore>()(
  persist(
    (set, get) => ({
      mode: "mock",
      provider: "gemini",
      apiKey: "",
      model: DEFAULT_GEMINI_MODEL,
      status: "untested",
      statusDetail: null,

      setMode: (mode) => set({ mode }),
      setProvider: (provider) =>
        set((state) =>
          state.provider === provider
            ? {}
            : {
                provider,
                model: defaultModelFor(provider),
                status: "untested",
                statusDetail: null,
              },
        ),
      setApiKey: (apiKey) => set({ apiKey, status: "untested", statusDetail: null }),
      setModel: (model) => set({ model, status: "untested", statusDetail: null }),

      testConnection: async () => {
        const { provider } = get();
        const apiKey = get().apiKey.trim();
        const model = get().model.trim() || defaultModelFor(provider);
        if (!apiKey) {
          set({ status: "failed", statusDetail: "Enter an API key first." });
          return;
        }
        set({ status: "testing", statusDetail: null });
        const result = await testProviderConnection(provider, apiKey, model);

        // Ignore a stale test if the user changed provider credentials mid-request.
        const current = get();
        if (
          current.provider !== provider ||
          current.apiKey.trim() !== apiKey ||
          (current.model.trim() || defaultModelFor(current.provider)) !== model
        ) {
          return;
        }

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
        provider: state.provider,
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
