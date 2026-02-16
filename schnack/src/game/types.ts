/** Types for the Dungeon World-inspired scene generator */

export type World = {
  setting: {
    name: string
    description: string
    tone: string
    key_locations: string[]
    factions: string[]
  }
  danger: {
    name: string
    type: string
    description: string
    motivation: string
    methods: string
  }
  grim_portents: string[]
  impending_doom: string
}

export type CharacterStats = {
  HARD: number
  SHARP: number
  SMOOTH: number
  COOL: number
  WEIRD: number
}

export type SpecialMove = {
  name: string
  trigger: string
  effect: string
}

export type Character = {
  name: string
  concept: string
  appearance: string
  background: string
  personality: string
  motivation: string
  flaw: string
  stats: CharacterStats
  special_moves: SpecialMove[]
  gear: string[]
  bonds: string[]
  secrets: string[]
  harm: number
  max_harm: number
}

export type SceneNPC = {
  name: string
  description: string
  role: string
  motivation: string
  stats_summary: string
}

export type Scene = {
  location: string
  location_description: string
  opening_situation: string
  time_and_conditions: string
  immediate_tension: string
  npcs_present: SceneNPC[]
  hidden_elements: string[]
  stakes: string
  private_context: Record<string, string>
}

export type CharacterResponse = {
  internal_thought: string
  action: string
  dialogue: string | null
  risk_assessment: string
}

export type GMCallForRoll = {
  character: string
  move: string
  stat: string
  difficulty_context: string
}

export type GMResponse = {
  gm_narration: string
  private_messages?: Record<string, string>
  prompt_character: string | null
  call_for_roll: GMCallForRoll | null
  scene_state_update?: {
    active_threats?: string[]
    changed_conditions?: string[]
  }
  scene_conclusion?: {
    concluded: boolean
    outcome_summary: string
    next_hook: string
  } | null
}
