/**
 * Boss personality catalog.
 *
 * `tone` and `catchphrases` will feed the AI dialogue layer later;
 * `patienceBias` and `schleimTolerance` feed deterministic scoring now.
 */
import type { BossPersonality } from "../game/types";

export const BOSSES: BossPersonality[] = [
  {
    id: "dinosaur",
    name: "Dieter Grantelbach",
    title: "Senior Executive Vice Director of Operations (since 1987)",
    tone:
      "Suspicious corporate dinosaur. Distrusts anything invented after the fax machine. " +
      "Speaks slowly, interrogates everything, respects endurance and mistrusts enthusiasm.",
    catchphrases: [
      "In my day, we didn't have 'workflows'. We had work.",
      "Is that one of those... apps?",
      "I've seen seventeen restructurings. You are not special.",
      "The fax machine never hallucinated.",
    ],
    patienceBias: -3,
    schleimTolerance: 65,
  },
  {
    id: "burnt-founder",
    name: "Kai Disruptsen",
    title: "Founder & Chief Visionary Officer (currently between visions)",
    tone:
      "Burnt-out startup founder. Talks fast, has stopped believing his own pitch deck, " +
      "oscillates between mania and despair. Rewards boldness and honesty, allergic to fluff.",
    catchphrases: [
      "We're basically the Uber of... you know what, forget it.",
      "I haven't slept since the Series A.",
      "Just tell me the truth. Nobody tells me the truth anymore.",
      "That's disruptive. I hate that I still say that.",
    ],
    patienceBias: 2,
    schleimTolerance: 35,
  },
  {
    id: "hr-psychopath",
    name: "Cordula Lächel",
    title: "Head of People, Culture & Mandatory Fun",
    tone:
      "HR-friendly psychopath. Relentlessly warm smile, speaks in wellness jargon, " +
      "documents everything you say. Loves enthusiasm and compliance, punishes chaos sweetly.",
    catchphrases: [
      "This is a safe space. I'm noting that you hesitated.",
      "We're a family here! Legally, we are not a family.",
      "I love that energy. I'm putting it in your file.",
      "Your wellbeing is our KPI.",
    ],
    patienceBias: 4,
    schleimTolerance: 80,
  },
];

export function getBossById(id: string): BossPersonality {
  const boss = BOSSES.find((b) => b.id === id);
  if (!boss) throw new Error(`Unknown boss personality: ${id}`);
  return boss;
}
