# Schleimer 🤝

> The Interview Simulator — flatter your way to employment.

**Schleimer** (German for *bootlicker*) is a single-screen dark-comedy interview
game. Pick three ridiculous hidden-skill cards, receive a semi-random corporate
job position, and try to convince a grumpy AI boss to hire you — without your
Schleim Level giving you away.

## Core loop (planned)

1. Pick **3 hidden-skill cards** (e.g. *Printer Whisperer*).
2. Get assigned a job like *Senior Synergy Evangelist*.
3. Answer the boss's questions using suggested answers — editable before sending.
4. Balance three meters: **Hire Chance**, **Boss Patience**, **Schleim Level**.

## Design principles

- **AI generates dialogue only.** Boss questions and reactions may come from an
  LLM; all scoring is deterministic and local (`src/game`).
- **Mock mode by default.** Fully playable without any API key.
- **Replaceable boss.** `src/components/boss/BossArea.tsx` is an isolated stage;
  a future 3D animated boss drops in without touching the rest of the app.
- One screen. No backend, no auth, no database. Deployable to Vercel as-is.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · framer-motion · Zustand

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
```

## Project structure

```
src/
  App.tsx                 # one-screen layout: boss | interview | HUD
  components/
    boss/BossArea.tsx     # replaceable boss stage (placeholder)
    interview/            # chat + answer choices (placeholder)
    hud/HudPanel.tsx      # meters + skill cards (placeholder)
  game/types.ts           # domain types; deterministic scoring lives here
  ai/bossBrain.ts         # AI adapter boundary (mock + real implementations)
```
