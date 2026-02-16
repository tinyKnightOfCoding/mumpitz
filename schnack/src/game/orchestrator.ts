import { generateCharacter, generateScene, generateWorld } from './generators.js'
import { characterTurn, getStat, gmTurn, type PlayTurn, resolveRoll } from './play.js'
import { createSession } from './session.js'
import type { Character, Scene, World } from './types.js'

const MAX_TURNS = 25

export type GameState = {
  world: World
  characters: Character[]
  scene: Scene
  turnHistory: PlayTurn[]
  activeThreats: string[]
  changedConditions: string[]
  sessionId: string
}

export async function runGame(initialPrompt: string): Promise<GameState> {
  const session = createSession(initialPrompt)
  console.log(`\n📁 Session: ${session.sessionId} (raw AI output → sessions/${session.sessionId}/)\n`)

  console.log('🏔️  Generating world...\n')
  const world = await generateWorld(initialPrompt, session)
  console.log(`   Setting: ${world.setting.name}`)
  console.log(`   Danger: ${world.danger.name}\n`)

  console.log('👤 Generating characters...\n')
  const characters: Character[] = []
  for (let i = 0; i < 3; i++) {
    const names = characters.map((c) => c.name)
    const c = await generateCharacter(initialPrompt, world, names, session, i + 1)
    characters.push(c)
    console.log(`   ${c.name}: ${c.concept}`)
  }
  console.log('')

  console.log('🎭 Generating scene...\n')
  const scene = await generateScene(initialPrompt, world, characters, session)
  console.log(`   Location: ${scene.location}`)
  console.log(`   ${scene.opening_situation}\n`)

  const state: GameState = {
    world,
    characters,
    scene,
    turnHistory: [],
    activeThreats: scene.hidden_elements.concat(),
    changedConditions: [],
    sessionId: session.sessionId,
  }

  console.log('━'.repeat(60))
  console.log('🎲 SCENE: Play begins')
  console.log('━'.repeat(60))

  let lastCharacterAction: string | undefined
  let rollResultToInterpret: string | undefined
  let promptCharacter: string | null = 'OPEN'
  let turnCount = 0
  let gmTurnIndex = 0
  const charTurnIndexByPlayer: Record<string, number> = {}

  while (turnCount < MAX_TURNS) {
    turnCount++

    // GM turn (includes roll result in context if we just rolled)
    const gmContext = rollResultToInterpret
      ? `${lastCharacterAction ?? ''}\n\n[ROLL RESULT - interpret this and narrate outcome]\n${rollResultToInterpret}`
      : lastCharacterAction
    rollResultToInterpret = undefined

    gmTurnIndex++
    const gmResponse = await gmTurn(world, characters, scene, state.turnHistory, gmContext, session, gmTurnIndex)

    const gmContent = gmResponse.gm_narration
    if (gmResponse.private_messages) {
      for (const [name, msg] of Object.entries(gmResponse.private_messages)) {
        console.log(`\n   [Private to ${name}] ${msg}`)
      }
    }
    console.log(`\n📜 GM: ${gmContent}`)

    state.turnHistory.push({ type: 'gm', actor: 'GM', content: gmContent })

    // Update scene state
    if (gmResponse.scene_state_update) {
      if (gmResponse.scene_state_update.active_threats) {
        state.activeThreats = gmResponse.scene_state_update.active_threats
      }
      if (gmResponse.scene_state_update.changed_conditions) {
        state.changedConditions = gmResponse.scene_state_update.changed_conditions
      }
    }

    // Check for scene conclusion
    if (gmResponse.scene_conclusion?.concluded) {
      console.log(`\n📌 Outcome: ${gmResponse.scene_conclusion.outcome_summary}`)
      console.log(`\n🔗 Next: ${gmResponse.scene_conclusion.next_hook}`)
      break
    }

    // If GM called for roll: we roll, then loop to let GM interpret
    if (gmResponse.call_for_roll) {
      const targetChar = characters.find((c) => c.name === gmResponse.call_for_roll?.character)
      if (targetChar) {
        const { total, result, dice } = resolveRoll(targetChar, gmResponse.call_for_roll.stat)
        const resultLabel =
          result === 'full' ? 'Full success (10+)' : result === 'partial' ? 'Partial success (7-9)' : 'Failure (6-)'
        rollResultToInterpret = `${targetChar.name} rolled ${gmResponse.call_for_roll.move} +${gmResponse.call_for_roll.stat}: ${dice[0]}+${dice[1]}+${getStat(targetChar, gmResponse.call_for_roll.stat)}=${total} → ${resultLabel}`
        console.log(`\n   🎲 ${rollResultToInterpret}`)
      }
      promptCharacter = null // Don't prompt character yet; GM interprets roll first
    } else {
      promptCharacter = gmResponse.prompt_character
    }

    if (!promptCharacter) {
      if (rollResultToInterpret) continue // Will do another GM turn to interpret
      break
    }

    // Character turn
    const char = characters.find((c) => c.name === promptCharacter)
    if (!char) {
      console.log(`\n   (Unknown character "${promptCharacter}", ending scene)`)
      break
    }

    const privateContext =
      scene.private_context[char.name] ?? gmResponse.private_messages?.[char.name] ?? 'Nothing special.'
    const otherChars = characters
      .filter((c) => c.name !== char.name)
      .map((c) => `${c.name}: ${c.concept}`)
      .join('; ')

    const charTurnIndex = (charTurnIndexByPlayer[char.name] ?? 0) + 1
    charTurnIndexByPlayer[char.name] = charTurnIndex
    const charResponse = await characterTurn(char, scene, gmContent, privateContext, otherChars, session, charTurnIndex)

    const actionText = charResponse.dialogue ? `${charResponse.action} "${charResponse.dialogue}"` : charResponse.action
    lastCharacterAction = actionText

    console.log(`\n⚔️  ${char.name}: ${actionText}`)
    if (charResponse.risk_assessment) {
      console.log(`   [Risk: ${charResponse.risk_assessment}]`)
    }

    state.turnHistory.push({
      type: 'character',
      actor: char.name,
      content: actionText,
      details: charResponse as unknown as Record<string, unknown>,
    })
  }

  console.log(`\n${'━'.repeat(60)}`)
  console.log('🏁 Scene complete')
  console.log(`${'━'.repeat(60)}\n`)

  return state
}
