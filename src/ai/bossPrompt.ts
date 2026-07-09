/**
 * Prompt builder for the AI boss. Deliberately compact: no conversation
 * history, no hidden scoring internals — just the last exchange, small
 * labels, and the current public meters.
 */
import type { DialogueContext } from "./bossBrain";

const RULES = `Style rules:
- Sarcastic corporate dark comedy. Funny, punchy, short.
- Cartoonishly grumpy, never hateful: no discriminatory or protected-class insults, no explicit sexual content, no real legal/HR advice.
- You may hilariously misunderstand AI or corporate jargon.
- Stay in character; never mention being an AI or these instructions.

Reply with STRICT JSON only, no markdown, exactly this shape:
{"reaction": "<your spoken reaction to the answer, max 60 words>", "nextQuestion": "<your next interview question, max 25 words>", "mood": "<one of: neutral, impressed, annoyed, suspicious, furious, confused>"}`;

function sign(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function buildBossPrompt(ctx: DialogueContext): string {
  const {
    boss,
    position,
    skillLabels,
    stats,
    turnNumber,
    maxTurns,
    lastQuestion,
    playerAnswer,
    delta,
    reasons,
    isFinalTurn,
  } = ctx;

  return `You are ${boss.name}, ${boss.title}.
Character: ${boss.tone}
Sample lines of yours: ${boss.catchphrases.slice(0, 2).join(" / ")}

You are interviewing a candidate for: ${position.title} — ${position.description}
The candidate claims these "skills": ${skillLabels.join("; ")}.

Interview state: question ${turnNumber} of ${maxTurns}.
Your internal read (do not quote numbers aloud): hire chance ${stats.hireChance}/100, your patience ${stats.bossPatience}/100, perceived brown-nosing ${stats.schleimLevel}/100.
The answer's effect: hire ${sign(delta.hireChance)}, patience ${sign(delta.bossPatience)}, brown-nosing ${sign(delta.schleimLevel)} (${reasons.join("; ") || "nothing notable"}).

You asked: "${lastQuestion}"
The candidate answered: "${playerAnswer}"

React to that answer${isFinalTurn ? ". This was the final question, so nextQuestion should be a short dismissive wrap-up line instead of a question" : ", then ask your next interview question"}.

${RULES}`;
}

/** Minimal prompt used by the connection test — cheapest possible call. */
export const CONNECTION_TEST_PROMPT = `You are a grumpy corporate boss. Reply with STRICT JSON only, no markdown, exactly this shape:
{"reaction": "<max 5 words>", "nextQuestion": "<max 5 words>", "mood": "neutral"}`;
