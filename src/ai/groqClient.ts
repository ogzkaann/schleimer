/** Groq REST client — BYOK, fetch-only, zero dependencies. */
import { AI_MOODS, type BossDialogue, type DialogueContext } from "./bossBrain";
import { parseBossDialogue } from "./bossDialogueParser";
import { buildBossPrompt, CONNECTION_TEST_PROMPT } from "./bossPrompt";
import type { ConnectionTestResult } from "./aiProvider";
import { toSafeProviderError } from "./providerErrors";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 15_000;

const STRICT_JSON_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "boss_dialogue",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reaction: { type: "string" },
        nextQuestion: { type: "string" },
        mood: { type: "string", enum: [...AI_MOODS] },
      },
      required: ["reaction", "nextQuestion", "mood"],
      additionalProperties: false,
    },
  },
} as const;

const JSON_OBJECT_FORMAT = { type: "json_object" } as const;

function shortHttpError(status: number): string {
  if (status === 401) return "Invalid API key";
  if (status === 400 || status === 403) return "No access to this model";
  if (status === 404) return "Model not found";
  if (status === 429) return "Rate limited";
  return "Provider temporarily unavailable";
}

async function requestDialogue(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<BossDialogue> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const isGptOss = model.startsWith("openai/gpt-oss-");
  const supportsStrictSchema =
    model === "openai/gpt-oss-20b" || model === "openai/gpt-oss-120b";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        response_format: supportsStrictSchema ? STRICT_JSON_SCHEMA : JSON_OBJECT_FORMAT,
        ...(isGptOss
          ? {
              reasoning_effort: "low",
              include_reasoning: false,
              max_completion_tokens: 256,
            }
          : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(shortHttpError(response.status));

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("Empty or malformed response");
    }
    const content = (data as {
      choices?: Array<{ message?: { content?: string } }>;
    })?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty or malformed response");

    try {
      return parseBossDialogue(content);
    } catch {
      throw new Error("Empty or malformed response");
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function generateGroqBossDialogue(
  apiKey: string,
  model: string,
  context: DialogueContext,
): Promise<BossDialogue> {
  return requestDialogue(apiKey, model, buildBossPrompt(context));
}

export async function testGroqConnection(
  apiKey: string,
  model: string,
): Promise<ConnectionTestResult> {
  try {
    await requestDialogue(apiKey, model, CONNECTION_TEST_PROMPT);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toSafeProviderError(error) };
  }
}
