/**
 * Game store — the single source of truth the UI connects to.
 *
 * All numbers come from src/game (deterministic). Boss dialogue comes from
 * src/ai: the mock boss by default, or a BYOK provider when enabled — either way
 * only the words change, never the scores.
 */
import { create } from "zustand";
import type {
  AnswerOption,
  BossPersonality,
  ChatMessage,
  Ending,
  GamePhase,
  Position,
  ScoreResult,
  SkillCard,
} from "../game/types";
import { MAX_TURNS, SKILLS_OFFERED, SKILLS_TO_PICK } from "../game/types";
import { SKILLS } from "../content/skills";
import { POSITIONS } from "../content/positions";
import { getBossById } from "../content/bosses";
import { matchPosition, type PositionMatchResult } from "../game/matching";
import { buildSuggestions } from "../game/suggestions";
import { scoreAnswer } from "../game/scoring";
import { evaluateEnding } from "../game/endings";
import type { AiMood, BossDialogue, DialogueContext } from "../ai/bossBrain";
import { mockBossDialogue } from "../ai/mockBoss";
import { generateProviderBossDialogue } from "../ai/aiProvider";
import { useAiSettings, aiBossEnabled, defaultModelFor } from "../ai/aiSettings";

const START_STATS = { hireChance: 30, bossPatience: 70, schleimLevel: 5 };

let messageSeq = 0;
function msg(author: ChatMessage["author"], text: string): ChatMessage {
  return { id: `m${++messageSeq}`, author, text };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface GameStore {
  phase: GamePhase;
  offeredSkills: SkillCard[];
  selectedSkills: SkillCard[];
  position: Position | null;
  boss: BossPersonality | null;
  turnNumber: number;
  maxTurns: typeof MAX_TURNS;
  hireChance: number;
  bossPatience: number;
  schleimLevel: number;
  conversation: ChatMessage[];
  ending: Ending | null;

  /** Current question's suggested answers. */
  suggestions: AnswerOption[];
  selectedAnswerId: string | null;
  /** The (possibly edited) answer text that will be submitted. */
  draftText: string;
  /** True while boss dialogue is being generated — Send stays disabled. */
  bossThinking: boolean;
  /** Latest mood label from the dialogue layer (mock or AI). */
  bossMoodLabel: AiMood | null;
  /** True when the last turn fell back from AI to the mock boss. */
  aiFallback: boolean;
  /** Debug info for dev tools. */
  lastScore: ScoreResult | null;
  matchDebug: PositionMatchResult | null;

  startNewGame: () => void;
  chooseSkill: (skillId: string) => void;
  confirmSkills: () => void;
  selectAnswer: (answerId: string) => void;
  editAnswer: (text: string) => void;
  submitAnswer: () => Promise<void>;
  resetGame: () => void;
}

const INITIAL = {
  phase: "pick-skills" as GamePhase,
  offeredSkills: [] as SkillCard[],
  selectedSkills: [] as SkillCard[],
  position: null,
  boss: null,
  turnNumber: 0,
  maxTurns: MAX_TURNS as typeof MAX_TURNS,
  ...START_STATS,
  conversation: [] as ChatMessage[],
  ending: null,
  suggestions: [] as AnswerOption[],
  selectedAnswerId: null,
  draftText: "",
  bossThinking: false,
  bossMoodLabel: null,
  aiFallback: false,
  lastScore: null,
  matchDebug: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  startNewGame: () => {
    set({
      ...INITIAL,
      offeredSkills: shuffle(SKILLS, Math.random).slice(0, SKILLS_OFFERED),
    });
  },

  chooseSkill: (skillId) => {
    const { phase, offeredSkills, selectedSkills } = get();
    if (phase !== "pick-skills") return;
    if (selectedSkills.some((s) => s.id === skillId)) {
      set({ selectedSkills: selectedSkills.filter((s) => s.id !== skillId) });
      return;
    }
    if (selectedSkills.length >= SKILLS_TO_PICK) return;
    const skill = offeredSkills.find((s) => s.id === skillId);
    if (skill) set({ selectedSkills: [...selectedSkills, skill] });
  },

  confirmSkills: () => {
    const { phase, selectedSkills } = get();
    if (phase !== "pick-skills" || selectedSkills.length !== SKILLS_TO_PICK) return;

    const match = matchPosition(selectedSkills, POSITIONS);
    const position = match.position;
    const boss = getBossById(position.bossPersonalityId);
    const firstQuestion = position.questionPool[0];

    set({
      phase: "interview",
      position,
      boss,
      matchDebug: match,
      turnNumber: 1,
      bossMoodLabel: null,
      aiFallback: false,
      bossPatience: Math.max(0, Math.min(100, START_STATS.bossPatience + boss.patienceBias * 2)),
      conversation: [
        msg("boss", `${boss.name}, ${boss.title}. Sit. You're here for the ${position.title} role, apparently.`),
        msg("boss", firstQuestion),
      ],
      suggestions: buildSuggestions({
        question: firstQuestion,
        position,
        selectedSkills,
        boss,
        turnNumber: 1,
      }),
      selectedAnswerId: null,
      draftText: "",
    });
  },

  selectAnswer: (answerId) => {
    if (get().bossThinking) return;
    const option = get().suggestions.find((o) => o.id === answerId);
    if (option) set({ selectedAnswerId: option.id, draftText: option.text });
  },

  editAnswer: (text) => set({ draftText: text }),

  submitAnswer: async () => {
    const state = get();
    const { phase, position, boss, selectedSkills, turnNumber } = state;
    const option = state.suggestions.find((o) => o.id === state.selectedAnswerId);
    if (phase !== "interview" || state.bossThinking || !position || !boss || !option) return;
    const text = state.draftText.trim();
    if (!text) return;

    // 1) Deterministic scoring — always first, always local.
    const score = scoreAnswer({
      answerType: option.type,
      text,
      selectedSkills,
      position,
      boss,
      current: {
        hireChance: state.hireChance,
        bossPatience: state.bossPatience,
        schleimLevel: state.schleimLevel,
      },
    });
    const ending = evaluateEnding(score.stats, turnNumber, MAX_TURNS);
    const lastQuestion =
      [...state.conversation].reverse().find((m) => m.author === "boss")?.text ?? "";

    // Apply the scored answer immediately; dialogue arrives when it arrives.
    set({
      ...score.stats,
      conversation: [...state.conversation, msg("player", text)],
      lastScore: score,
      bossThinking: true,
      selectedAnswerId: null,
      draftText: "",
    });

    // 2) Boss dialogue — words only. AI if enabled, mock otherwise/on failure.
    const context: DialogueContext = {
      boss,
      position,
      skillLabels: selectedSkills.map((s) => s.label),
      stats: score.stats,
      turnNumber,
      maxTurns: MAX_TURNS,
      lastQuestion,
      playerAnswer: text,
      delta: score.delta,
      reasons: score.reasons,
      isFinalTurn: ending !== null,
    };

    let dialogue: BossDialogue | null = null;
    let fellBack = false;
    if (aiBossEnabled()) {
      const { provider, apiKey, model } = useAiSettings.getState();
      try {
        dialogue = await generateProviderBossDialogue(
          provider,
          apiKey.trim(),
          model.trim() || defaultModelFor(provider),
          context,
        );
      } catch {
        // Any AI failure: shrug, fall back, keep the game moving.
        fellBack = true;
      }
    }
    if (!dialogue) dialogue = mockBossDialogue(context);

    // Guard against reset/restart while the boss was thinking.
    const now = get();
    if (now.phase !== "interview" || now.turnNumber !== turnNumber) return;

    const conversation = [...now.conversation, msg("boss", dialogue.reaction)];

    if (ending) {
      set({
        conversation: [...conversation, msg("boss", ending.text)],
        ending,
        phase: "verdict",
        bossThinking: false,
        bossMoodLabel: dialogue.mood,
        aiFallback: fellBack,
        suggestions: [],
      });
      return;
    }

    const nextTurn = turnNumber + 1;
    set({
      conversation: [...conversation, msg("boss", dialogue.nextQuestion)],
      turnNumber: nextTurn,
      bossThinking: false,
      bossMoodLabel: dialogue.mood,
      aiFallback: fellBack,
      suggestions: buildSuggestions({
        question: dialogue.nextQuestion,
        position,
        selectedSkills,
        boss,
        turnNumber: nextTurn,
      }),
    });
  },

  resetGame: () => set({ ...INITIAL }),
}));
