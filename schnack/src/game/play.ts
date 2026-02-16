import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { completeSimple, getModel } from '@mariozechner/pi-ai'
import { extractJson, interpretRoll, roll2d6PlusStat } from './parse.js'
import type { SessionLogger } from './session.js'
import type { Character, CharacterResponse, GMResponse, Scene, World } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = join(__dirname, '../../prompts')

function loadPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), 'utf-8')
}

function getModelConfig() {
  return getModel('anthropic', 'claude-sonnet-4-5')
}

export type PlayTurn = {
  type: 'gm' | 'character'
  actor: string
  content: string
  details?: Record<string, unknown>
}

function extractText(content: ReadonlyArray<{ type: string; text?: string }>): string {
  return content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('')
}

export async function gmTurn(
  world: World,
  characters: Character[],
  scene: Scene,
  turnHistory: PlayTurn[],
  lastCharacterAction?: string,
  session?: SessionLogger,
  gmTurnIndex?: number,
): Promise<GMResponse> {
  const systemPrompt = loadPrompt('gm')
  const rulesPrompt = loadPrompt('rules')

  const historyText = turnHistory.map((t) => `[${t.type.toUpperCase()}] ${t.actor}: ${t.content}`).join('\n')

  const context = `
## World
${JSON.stringify(world.setting, null, 2)}

## Danger
${world.danger.name}: ${world.danger.description}

## Characters
${characters.map((c) => `- ${c.name}: ${c.concept}, Stats: ${JSON.stringify(c.stats)}`).join('\n')}

## Scene
Location: ${scene.location}
${scene.location_description}

Opening: ${scene.opening_situation}
Tension: ${scene.immediate_tension}
Stakes: ${scene.stakes}

NPCs present: ${scene.npcs_present.map((n) => `${n.name} (${n.role}): ${n.motivation}`).join('; ')}
Hidden elements: ${scene.hidden_elements.join('; ')}

Private context per character (weave into private_messages when relevant):
${Object.entries(scene.private_context)
  .map(([n, c]) => `${n}: ${c}`)
  .join('\n')}

## Rules Reference
${rulesPrompt}

## Turn History So Far
${historyText || '(Scene has just started)'}

${lastCharacterAction ? `\n## Latest Input (character action and/or roll result to interpret)\n${lastCharacterAction}\n` : ''}

Respond with your GM JSON.
- If this is the opening: narrate the scene and set prompt_character to the first character to act.
- If a character just acted: interpret their action; call_for_roll if a move is triggered, else narrate the outcome.
- If a roll result is included: interpret the roll (10+ success, 7-9 partial, 6- failure), narrate the outcome, and prompt_character for the next appropriate character.
`

  const model = getModelConfig()
  const response = await completeSimple(model, {
    messages: [{ role: 'user', content: context, timestamp: Date.now() }],
    systemPrompt: systemPrompt,
  })

  const text = extractText(response.content)
  session?.write(`gm-turn-${String(gmTurnIndex ?? 0).padStart(2, '0')}`, text)
  return extractJson<GMResponse>(text)
}

export async function characterTurn(
  character: Character,
  _scene: Scene,
  situationDescription: string,
  privateContext: string,
  otherCharactersInfo: string,
  session?: SessionLogger,
  charTurnIndex?: number,
): Promise<CharacterResponse> {
  const systemPrompt = loadPrompt('character')

  const characterSheet = `
Name: ${character.name}
Concept: ${character.concept}
Appearance: ${character.appearance}
Personality: ${character.personality}
Motivation: ${character.motivation}
Flaw: ${character.flaw}
Stats: ${JSON.stringify(character.stats)}
Special Moves: ${character.special_moves.map((m) => `${m.name} (${m.trigger})`).join(', ')}
Gear: ${character.gear.join(', ')}
Bonds: ${character.bonds.join(', ')}
`

  const context = `
## Your Character
${characterSheet}

## Current Situation (what everyone sees)
${situationDescription}

## What only YOU perceive/know
${privateContext}

## Other Characters Present
${otherCharactersInfo}

The GM has prompted you. What do you do? Respond with your action JSON only.
`

  const model = getModelConfig()
  const response = await completeSimple(model, {
    messages: [{ role: 'user', content: context, timestamp: Date.now() }],
    systemPrompt: systemPrompt,
  })

  const text = extractText(response.content)
  const safeName = character.name.replace(/\W+/g, '-')
  session?.write(`character-${safeName}-turn-${String(charTurnIndex ?? 0).padStart(2, '0')}`, text)
  return extractJson<CharacterResponse>(text)
}

export function getStat(character: Character, stat: string): number {
  const stats = character.stats as unknown as Record<string, number>
  return stats[stat] ?? 0
}

export function resolveRoll(
  character: Character,
  stat: string,
): { total: number; result: 'full' | 'partial' | 'failure'; dice: [number, number] } {
  const statValue = getStat(character, stat)
  const { total, dice } = roll2d6PlusStat(statValue)
  const result = interpretRoll(total)
  return { total, result, dice }
}
