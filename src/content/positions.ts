/**
 * Position catalog — the corporate fever dreams the player can be matched to.
 *
 * requiredTags use the same vocabulary as SkillCard.hiddenTags.
 * Each questionPool holds MAX_TURNS (8) sarcastic questions, asked in order.
 */
import type { Position } from "../game/types";

export const POSITIONS: Position[] = [
  {
    id: "junior-ai-workflow-specialist",
    title: "Junior AI Workflow Specialist",
    description:
      "You will automate workflows nobody understands, using AI nobody trusts, " +
      "for stakeholders who still print their emails.",
    requiredTags: ["ai", "prompting", "automation", "technical"],
    preferredStats: { technical: 3, logic: 2, creativity: 2 },
    bossPersonalityId: "dinosaur",
    questionPool: [
      "So you 'work with AI'. Does it work, or do you just apologize for it?",
      "Explain a 'workflow' to me like I'm someone who has real work to do.",
      "Our last AI project renamed every customer to 'undefined'. Your thoughts?",
      "What would you automate first here — and don't say 'my own job', the last one tried that.",
      "How do you check the machine isn't just confidently lying? Asking for our legal department.",
      "The intern says you can 'prompt'. Is that a skill or a personality flaw?",
      "If the AI and the fax machine disagree, who wins? Think carefully.",
      "Final question: why should I trust you with robots when I don't even trust the coffee machine?",
    ],
  },
  {
    id: "excel-crisis-manager",
    title: "Excel Crisis Manager",
    description:
      "When the quarterly forecast becomes 47,000 rows of #REF!, you are the one " +
      "they call. God help you.",
    requiredTags: ["excel", "data", "crisis", "technical"],
    preferredStats: { technical: 3, logic: 3, confidence: 1 },
    bossPersonalityId: "dinosaur",
    questionPool: [
      "The budget spreadsheet has 34 tabs and one is just called 'DO NOT OPEN'. What's your move?",
      "A director sums a column by reading numbers out loud. How do you intervene without a scene?",
      "Someone merged cells in the master file. The someone was me. Proceed carefully.",
      "Describe your relationship with VLOOKUP. Be honest, this is a safe spreadsheet.",
      "The forecast says we'll be profitable in 1904. Where do you even start?",
      "How many undos is too many undos? There is a correct answer.",
      "Circular reference in the bonus calculator. Payroll runs in an hour. Go.",
      "Last question: Excel crashes with unsaved changes. What do you feel? I'm testing for trauma.",
    ],
  },
  {
    id: "prompt-operations-assistant",
    title: "Prompt Operations Assistant",
    description:
      "You will type things into AI tools all day and take credit with dignity. " +
      "The AI will not be consulted about this arrangement.",
    requiredTags: ["ai", "prompting", "documentation", "creativity"],
    preferredStats: { creativity: 3, technical: 2, honesty: 1 },
    bossPersonalityId: "hr-psychopath",
    questionPool: [
      "How would you describe your relationship with our AI tools? Remember: they may be reading this.",
      "Walk me through your favorite prompt. I'm noting your body language, keep going.",
      "If the AI produces something brilliant, whose achievement is that? Choose lovingly.",
      "How do you stay 'authentic' while outsourcing your thoughts? We value authenticity here.",
      "An AI wrote a better email than you. How does that make you feel? This IS the interview.",
      "Describe a time you took feedback from a machine gracefully.",
      "We track prompt efficiency per employee. Does that excite you? The correct answer is yes.",
      "Finally: promise me you'll never say 'the AI did it'. Sign here. Verbally.",
    ],
  },
  {
    id: "digital-transformation-trainee",
    title: "Digital Transformation Trainee",
    description:
      "You will help transform processes from 'broken' to 'broken, but with dashboards'. " +
      "Buzzword fluency required, results optional.",
    requiredTags: ["buzzword", "innovation", "presentation", "corporate"],
    preferredStats: { corporate: 3, creativity: 2, confidence: 2 },
    bossPersonalityId: "burnt-founder",
    questionPool: [
      "Define 'digital transformation' without using the words 'digital' or 'transformation'. Go.",
      "Our transformation is in year six of a two-year plan. What does that tell you?",
      "Sell me a dashboard. I have nine. None of them load. Sell me a tenth.",
      "What's the difference between a 'pivot' and 'giving up'? I genuinely need to know.",
      "How many sticky notes does it take to change a company? We've used forty thousand.",
      "A consultant said 'synergy' to me this morning and I felt nothing. Fix me.",
      "If our processes were an animal, which animal, and why is it a fax machine?",
      "Last one: transform THIS interview. Right now. Impress me or free me.",
    ],
  },
  {
    id: "ceo-shadowing-associate",
    title: "CEO Shadowing Associate",
    description:
      "You will follow the CEO everywhere, nod meaningfully, and carry two phones. " +
      "Neither phone is for you.",
    requiredTags: ["flattery", "psychology", "networking", "coffee"],
    preferredStats: { schleim: 2, confidence: 2, corporate: 2, creativity: 1 },
    bossPersonalityId: "hr-psychopath",
    questionPool: [
      "The CEO makes a joke. It is not funny. Show me your face. ...Interesting. Noted.",
      "How do you carry a coffee at walking-meeting pace without eye contact violations?",
      "The CEO forgets a client's name mid-handshake. You have two seconds. What do you whisper?",
      "Rank these: loyalty, discretion, punctuality, cufflink management. Justify nothing.",
      "What does 'reading the room' mean when the room is one powerful man and his mood?",
      "You overhear something confidential in the elevator. Walk me through your amnesia.",
      "The CEO's presentation is wrong on slide two. Do you exist in that moment? Explain.",
      "Final question: describe yourself in three words. One of them must be 'discreet'.",
    ],
  },
  {
    id: "internal-automation-intern",
    title: "Internal Automation Intern",
    description:
      "You will automate the tasks nobody wants, then explain to those same people " +
      "why they should thank you. Unpaid overtime is a rounding error.",
    requiredTags: ["automation", "technical", "excel", "logic"],
    preferredStats: { technical: 3, logic: 3, chaos: 1 },
    bossPersonalityId: "burnt-founder",
    questionPool: [
      "If you automate a pointless task, is it still pointless? Faster? Don't philosophize, answer.",
      "Karin has done this report manually for 11 years. Your script does it in 4 seconds. Handle Karin.",
      "What's your backup plan when the automation emails the entire company at 3 AM? Mine didn't have one.",
      "Script breaks. Nobody remembers how the manual process worked. You wrote the script. Enjoy.",
      "How do you document something so that even future-you doesn't hate present-you?",
      "Automate or delegate: the printer. Trick question, it cannot be automated. It can barely be delegated.",
      "Is a macro with 400 lines a solution or a cry for help? I wrote one once. Be kind.",
      "Last question: what would you refuse to automate? There is a wrong answer and it's 'nothing'.",
    ],
  },
  {
    id: "meeting-productivity-analyst",
    title: "Meeting Productivity Analyst",
    description:
      "You will attend meetings about meetings, measure their pointlessness scientifically, " +
      "and present the findings — in a meeting.",
    requiredTags: ["meetings", "data", "logic", "survival"],
    preferredStats: { logic: 3, honesty: 2, corporate: 2 },
    bossPersonalityId: "dinosaur",
    questionPool: [
      "This meeting, right now: necessary or an email? Careful. Your salary attends this meeting.",
      "How would you measure whether a meeting achieved anything? Assume it didn't.",
      "A recurring meeting has no agenda, no owner, and 14 attendees. It has met for 3 years. Diagnose.",
      "Someone says 'let's take this offline' in an offline meeting. What happens to them?",
      "What's the optimal number of people in a decision meeting? It's not 14. Defend your number.",
      "Describe the perfect meeting. Brevity will be scored. Heavily.",
      "If I cancel all meetings for a week, what actually breaks? Dream with me.",
      "Final: this interview has run long. Whose fault is that? Choose wisely.",
    ],
  },
  {
    id: "corporate-innovation-assistant",
    title: "Corporate Innovation Assistant",
    description:
      "You will help the innovation department innovate. The innovation department " +
      "was founded in 2011 and has innovated one (1) app. It shows the cafeteria menu.",
    requiredTags: ["innovation", "creativity", "buzzword", "presentation"],
    preferredStats: { creativity: 3, chaos: 2, corporate: 2 },
    bossPersonalityId: "burnt-founder",
    questionPool: [
      "Give me one idea. Right now. Raw. Unwashed. I'll wait exactly four seconds.",
      "Our ideation funnel produced 900 ideas last year. We shipped zero. Where do ideas go to die?",
      "Is a hackathon innovation or team building with energy drinks? I've stopped being able to tell.",
      "The cafeteria app has 4.8 stars. It's our proudest achievement. React to that. Emotionally.",
      "How do you tell an executive their idea is bad, using only positive words?",
      "'Fail fast' — we've mastered the failing. When does the 'fast' part start?",
      "Pitch me the opposite of your best idea. If it's better, we have a problem.",
      "Final question: innovate the word 'innovation'. It's tired. We're all tired.",
    ],
  },
];

export function getPositionById(id: string): Position {
  const position = POSITIONS.find((p) => p.id === id);
  if (!position) throw new Error(`Unknown position: ${id}`);
  return position;
}
