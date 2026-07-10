import type { BossDialogue, DialogueContext } from "./bossBrain";
import {
  generateBossDialogue as generateGeminiBossDialogue,
  testGeminiConnection,
} from "./geminiClient";
import { generateGroqBossDialogue, testGroqConnection } from "./groqClient";

export type AiProvider = "gemini" | "groq";
export type ConnectionTestResult = { ok: true } | { ok: false; error: string };

export function generateProviderBossDialogue(
  provider: AiProvider,
  apiKey: string,
  model: string,
  context: DialogueContext,
): Promise<BossDialogue> {
  return provider === "groq"
    ? generateGroqBossDialogue(apiKey, model, context)
    : generateGeminiBossDialogue(apiKey, model, context);
}

export function testProviderConnection(
  provider: AiProvider,
  apiKey: string,
  model: string,
): Promise<ConnectionTestResult> {
  return provider === "groq"
    ? testGroqConnection(apiKey, model)
    : testGeminiConnection(apiKey, model);
}
