/**
 * Gemini REST client — BYOK, fetch-only, zero dependencies.
 *
 * The key travels in the `x-goog-api-key` header (never in the URL, never
 * logged, never stored outside the browser's localStorage). Responses are
 * requested as structured JSON and still validated defensively; any invalid
 * output throws, and the caller falls back to the mock boss.
 */
import { AI_MOODS, type AiMood, type BossDialogue, type DialogueContext } from "./bossBrain";
import { buildBossPrompt, CONNECTION_TEST_PROMPT } from "./bossPrompt";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 15_000;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reaction: { type: "STRING" },
    nextQuestion: { type: "STRING" },
    mood: { type: "STRING", enum: [...AI_MOODS] },
  },
  required: ["reaction", "nextQuestion", "mood"],
} as const;

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Parse and validate model output into a BossDialogue. Throws if invalid. */
export function parseBossDialogue(raw: string): BossDialogue {
  // Defensive: strip markdown fences some models add despite instructions.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const parsed: unknown = JSON.parse(cleaned);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }
  const record = parsed as Record<string, unknown>;
  const { reaction, nextQuestion, mood } = record;
  if (typeof reaction !== "string" || reaction.trim().length === 0) {
    throw new Error("Missing reaction");
  }
  if (typeof nextQuestion !== "string" || nextQuestion.trim().length === 0) {
    throw new Error("Missing nextQuestion");
  }

  return {
    reaction: clampWords(reaction, 60),
    nextQuestion: clampWords(nextQuestion, 25),
    mood: AI_MOODS.includes(mood as AiMood) ? (mood as AiMood) : "neutral",
  };
}

function shortHttpError(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "Invalid API key (or no access to this model).";
  }
  if (status === 404) return "Model not found — check the model name.";
  if (status === 429) return "Rate limited — try again in a moment.";
  return `Connection failed (HTTP ${status}).`;
}

async function requestDialogue(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<BossDialogue> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(shortHttpError(response.status));

    const data: unknown = await response.json();
    const parts = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      ?.candidates?.[0]?.content?.parts;
    const text = parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error("Empty model response");

    return parseBossDialogue(text);
  } finally {
    clearTimeout(timeout);
  }
}

/** Generate the boss's reaction + next question. Throws on any failure. */
export function generateBossDialogue(
  apiKey: string,
  model: string,
  context: DialogueContext,
): Promise<BossDialogue> {
  return requestDialogue(apiKey, model, buildBossPrompt(context));
}

export type ConnectionTestResult = { ok: true } | { ok: false; error: string };

/** One tiny low-token call to verify key + model + JSON shape. */
export async function testGeminiConnection(
  apiKey: string,
  model: string,
): Promise<ConnectionTestResult> {
  try {
    await requestDialogue(apiKey, model, CONNECTION_TEST_PROMPT);
    return { ok: true };
  } catch (error) {
    // Short, user-safe message only — no stack traces, never the key.
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Connection timed out."
        : error instanceof Error && error.message.length < 80
          ? error.message
          : "Connection failed.";
    return { ok: false, error: message };
  }
}
