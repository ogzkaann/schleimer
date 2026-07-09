/**
 * Suggested answer generation — pure templates, no AI. The player can edit
 * any suggestion before submitting; scoring reads the final text.
 */
import type {
  AnswerOption,
  AnswerType,
  BossPersonality,
  Position,
  SkillCard,
} from "./types";

export interface SuggestionContext {
  question: string;
  position: Position;
  selectedSkills: SkillCard[];
  boss: BossPersonality;
  turnNumber: number;
  rng?: () => number;
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Card labels are full first-person clauses ("I can open Excel without
 * sweating"), so they can be embedded mid-sentence with a lowercase start.
 */
function midSentence(label: string): string {
  if (/^I\b/.test(label)) return label; // "I" stays capitalized mid-sentence
  return label.charAt(0).toLowerCase() + label.slice(1);
}

const SAFE_TEMPLATES = [
  (c: Ctx) =>
    `That's a fair question. I'd bring structure to the ${c.tag} side of the ${c.job} role — ${c.skill}, reliably and without drama.`,
  (c: Ctx) =>
    `I'd start small: understand how ${c.tag} works here, then contribute where it counts. For what it's worth, ${c.skill}.`,
  (c: Ctx) =>
    `Honestly, a solid process beats heroics. I handle ${c.tag} calmly — ${c.skill}, which tends to help.`,
];

const HONEST_TEMPLATES = [
  (c: Ctx) =>
    `Truthfully? I don't have a rehearsed answer. But ${c.skill}, and I'd rather be useful at ${c.tag} than impressive on paper.`,
  (c: Ctx) =>
    `I'll be straight with you: I'm still learning ${c.tag}. What I do know is that ${c.skill}, and I don't pretend otherwise.`,
];

const BOLD_TEMPLATES = [
  (c: Ctx) =>
    `Let me be direct: you need someone who owns ${c.tag}, and that's me. ${c.skillCap}. Try to find that twice.`,
  (c: Ctx) =>
    `With respect — most candidates will tell you what you want to hear. I'll just fix your ${c.tag} problem. ${c.skillCap}.`,
  (c: Ctx) =>
    `I didn't apply to be a ${c.job} to play it safe. ${c.skillCap}, and I'm planning to prove it in week one.`,
];

const CHAOS_TEMPLATES = [
  (c: Ctx) =>
    `Bold of you to assume I haven't already started. ${c.skillCap}. The ${c.tag} situation here talks about me in its sleep.`,
  (c: Ctx) =>
    `Great question. Counter-question: is the ${c.job} role ready for someone like me? ${c.skillCap}, and I have never once been normal about ${c.tag}.`,
];

const SCHLEIM_TEMPLATES = [
  (c: Ctx) =>
    `What a brilliant question — truly. Working under a visionary like you on ${c.tag} would be an honor. Also, ${c.skill}, which I'd humbly put at your service.`,
  (c: Ctx) =>
    `First: incredible company, inspiring leadership, flawless coffee. As a ${c.job}, my roadmap is simple — total alignment with your vision. And ${c.skill}.`,
  (c: Ctx) =>
    `You said it best yourself: "${c.catchphrase}" I think about that a lot. It would be a privilege to bring my ${c.tag} synergy to your team.`,
];

interface Ctx {
  job: string;
  tag: string;
  skill: string;
  skillCap: string;
  catchphrase: string;
}

/**
 * Build the three suggestions for the current question:
 * Safe (sometimes Honest), Bold (sometimes Chaos), and always one Schleimer.
 */
export function buildSuggestions(context: SuggestionContext): AnswerOption[] {
  const { position, selectedSkills, boss, turnNumber } = context;
  const rng = context.rng ?? Math.random;

  const skill = pick(selectedSkills, rng);
  const ctx: Ctx = {
    job: position.title,
    tag: pick(position.requiredTags, rng),
    skill: midSentence(skill.label),
    skillCap: skill.label,
    catchphrase: pick(boss.catchphrases, rng),
  };

  // Variety: every third turn the calm option turns honest, and mid-game
  // the aggressive option turns chaotic. Types drive scoring, labels the UI.
  const calmType: AnswerType = turnNumber % 3 === 0 ? "honest" : "safe";
  const spicyType: AnswerType = turnNumber % 4 === 2 ? "chaos" : "bold";

  const calm = calmType === "honest" ? pick(HONEST_TEMPLATES, rng) : pick(SAFE_TEMPLATES, rng);
  const spicy = spicyType === "chaos" ? pick(CHAOS_TEMPLATES, rng) : pick(BOLD_TEMPLATES, rng);
  const schleim = pick(SCHLEIM_TEMPLATES, rng);

  const hints = {
    usedSkillIds: [skill.id],
    keywords: [ctx.tag],
  };

  return [
    {
      id: `t${turnNumber}-calm`,
      label: calmType === "honest" ? "Honest" : "Safe",
      type: calmType,
      text: calm(ctx),
      hints,
    },
    {
      id: `t${turnNumber}-spicy`,
      label: spicyType === "chaos" ? "Chaos" : "Bold",
      type: spicyType,
      text: spicy(ctx),
      hints,
    },
    {
      id: `t${turnNumber}-schleim`,
      label: "Schleimer",
      type: "schleim",
      text: schleim(ctx),
      hints,
    },
  ];
}
