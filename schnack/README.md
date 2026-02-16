# Schnack – Dungeon World Scene Generator

A proof-of-concept pen-and-paper scene generator where the **GM** and **characters** are separate AI agents. The world, characters, and scene are generated from an initial prompt, then the scene is played through with turn-taking between GM and character agents.

## Flow

1. **Get initial prompt** (CLI argument or default)
2. **Generate world** (setting, danger, grim portents)
3. **Generate 3 characters** (stats, moves, gear, bonds)
4. **Generate scene** (location, tension, NPCs, private context)
5. **Play through scene** (GM narrates, characters act, rolls resolved)

## Setup

```bash
pnpm install
cp .env.example .env
# Edit .env and add OPENAI_API_KEY=...
```

## Run

```bash
pnpm start
```

With a custom prompt:

```bash
pnpm start "Medieval heist: three thieves steal a dragon egg from a wizard tower"
```

## Debug Sessions

Each run creates a session with a unique ID. Raw AI output is written to `sessions/{session-id}/` for debugging:

- `00-initial-prompt.txt` – The prompt that started the run
- `01-world.txt` – World generation response
- `02-character-1.txt`, `03-character-2.txt`, `04-character-3.txt` – Character generation
- `05-scene.txt` – Scene generation
- `06-gm-turn-01.txt`, `07-character-Name-turn-01.txt`, … – Play loop responses

The session ID is printed at the start of each run.

## Tech

- **@mariozechner/pi-ai** – LLM calls via `completeSimple`
- **@mariozechner/pi-agent-core** – Available for more advanced agent setups
- Prompts in `prompts/` – world-generation, character-generation, scene-generation, gm, character, rules
