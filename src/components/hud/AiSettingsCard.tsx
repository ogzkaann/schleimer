/**
 * AiSettingsCard — compact BYOK controls for the boss brain.
 * Mock Boss is the default; AI Boss needs the player's own Gemini key.
 */
import { motion } from "framer-motion";
import { useAiSettings, DEFAULT_GEMINI_MODEL, type ConnectionStatus } from "../../ai/aiSettings";

const STATUS_VIEW: Record<ConnectionStatus, { dot: string; label: string; text: string }> = {
  untested: { dot: "bg-ink-300", label: "Not tested", text: "text-ink-500" },
  testing: { dot: "bg-ember-400", label: "Testing…", text: "text-ink-500" },
  connected: { dot: "bg-success-500", label: "✓ Connected", text: "text-success-500" },
  failed: { dot: "bg-danger-500", label: "✗ Not connected", text: "text-danger-500" },
};

export function StatusDot({ status }: { status: ConnectionStatus }) {
  const view = STATUS_VIEW[status];
  return (
    <motion.span
      animate={status === "testing" ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
      transition={status === "testing" ? { duration: 0.8, repeat: Infinity } : undefined}
      className={`inline-block h-2 w-2 rounded-full ${view.dot}`}
    />
  );
}

export function AiSettingsCard() {
  const mode = useAiSettings((s) => s.mode);
  const apiKey = useAiSettings((s) => s.apiKey);
  const model = useAiSettings((s) => s.model);
  const status = useAiSettings((s) => s.status);
  const statusDetail = useAiSettings((s) => s.statusDetail);
  const setMode = useAiSettings((s) => s.setMode);
  const setApiKey = useAiSettings((s) => s.setApiKey);
  const setModel = useAiSettings((s) => s.setModel);
  const testConnection = useAiSettings((s) => s.testConnection);

  const statusView = STATUS_VIEW[status];

  return (
    <div className="rounded-card bg-cream-50 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
          Boss Brain
        </h2>
        {mode === "ai" && <StatusDot status={status} />}
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream-200 p-1">
        {(["mock", "ai"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === value
                ? "bg-cream-50 text-ink-900 shadow-card"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {value === "mock" ? "Mock Boss" : "AI Boss"}
          </button>
        ))}
      </div>

      {mode === "ai" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <div className="mt-3 space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Gemini API key"
              autoComplete="off"
              className="w-full rounded-xl border border-cream-300 bg-cream-100 px-3 py-2 text-xs outline-none transition focus:border-ember-400"
            />
            <input
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={DEFAULT_GEMINI_MODEL}
              autoComplete="off"
              className="w-full rounded-xl border border-cream-300 bg-cream-100 px-3 py-2 text-xs outline-none transition focus:border-ember-400"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void testConnection()}
                disabled={status === "testing"}
                className="rounded-xl bg-ember-500 px-3 py-1.5 text-xs font-semibold text-cream-50 shadow-card transition hover:bg-ember-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "testing" ? "Testing…" : "Test connection"}
              </button>
              <span className={`text-xs font-medium ${statusView.text}`}>
                {statusView.label}
              </span>
            </div>
            {statusDetail && (
              <p className="text-[11px] text-danger-500">{statusDetail}</p>
            )}
          </div>
        </motion.div>
      )}

      <ul className="mt-3 space-y-0.5 text-[11px] italic text-ink-300">
        <li>Your key stays in this browser.</li>
        <li>Scoring stays local. AI only writes boss dialogue.</li>
        <li>Mock mode works without any key.</li>
      </ul>
    </div>
  );
}
