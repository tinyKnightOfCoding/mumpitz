import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { completeSimple, getModel } from '@mariozechner/pi-ai'
import { extractJson } from './parse.js'
import type { SessionLogger } from './session.js'
import type { Character, Scene, World } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = join(__dirname, '../../prompts')

function loadPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), 'utf-8')
}

function getModelConfig() {
  return getModel('anthropic', 'claude-sonnet-4-5')
}

export async function generateWorld(initialPrompt: string, session?: SessionLogger): Promise<World> {
  const systemPrompt = loadPrompt('world-generation')
  const model = getModelConfig()

  const response = await completeSimple(model, {
    messages: [
      {
        role: 'user',
        content: `Create a world based on this prompt:\n\n${initialPrompt}`,
        timestamp: Date.now(),
      },
    ],
    systemPrompt: systemPrompt,
  })

  const text =
    typeof response.content[0] === 'object' && 'text' in response.content[0]
      ? (response.content[0] as { text: string }).text
      : String(response.content[0])
  session?.write('world', text)
  return extractJson<World>(text)
}

export async function generateCharacter(
  initialPrompt: string,
  world: World,
  existingCharacterNames: string[],
  session?: SessionLogger,
  index?: number,
): Promise<Character> {
  const systemPrompt = loadPrompt('character-generation')
  const model = getModelConfig()

  const context = `
Initial concept prompt: ${initialPrompt}

World context:
- Setting: ${world.setting.name}
- Tone: ${world.setting.tone}
- Factions: ${world.setting.factions.join(', ')}
- Danger: ${world.danger.name}

Already created characters (ensure different concepts): ${existingCharacterNames.join(', ') || 'None yet'}
`

  const response = await completeSimple(model, {
    messages: [{ role: 'user', content: context, timestamp: Date.now() }],
    systemPrompt: systemPrompt,
  })

  const text =
    typeof response.content[0] === 'object' && 'text' in response.content[0]
      ? (response.content[0] as { text: string }).text
      : String(response.content[0])
  session?.write(`character-${index ?? '?'}`, text)
  return extractJson<Character>(text)
}

export async function generateScene(
  initialPrompt: string,
  world: World,
  characters: Character[],
  session?: SessionLogger,
): Promise<Scene> {
  const systemPrompt = loadPrompt('scene-generation')
  const model = getModelConfig()

  const context = `
Initial prompt: ${initialPrompt}

World: ${world.setting.name}
Tone: ${world.setting.tone}
Current danger: ${world.danger.name}

Characters in this scene:
${characters.map((c) => `- ${c.name}: ${c.concept} (${c.motivation})`).join('\n')}
`

  const response = await completeSimple(model, {
    messages: [{ role: 'user', content: context, timestamp: Date.now() }],
    systemPrompt: systemPrompt,
  })

  const text =
    typeof response.content[0] === 'object' && 'text' in response.content[0]
      ? (response.content[0] as { text: string }).text
      : String(response.content[0])
  session?.write('scene', text)
  return extractJson<Scene>(text)
}
