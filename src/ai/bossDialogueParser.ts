import { AI_MOODS, type AiMood, type BossDialogue } from "./bossBrain";

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/** Parse and validate model output into a BossDialogue. Throws if invalid. */
export function parseBossDialogue(raw: string): BossDialogue {
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
