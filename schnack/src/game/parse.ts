/** Extract JSON from LLM response (handles markdown code blocks) */
export function extractJson<T>(text: string): T {
  let cleaned = text.trim()
  // Remove markdown code block if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = (codeBlockMatch[1] !== undefined ? codeBlockMatch[1] : cleaned).trim()
  }
  return JSON.parse(cleaned) as T
}

/** Roll 2d6 + stat (Dungeon World mechanic) */
export function roll2d6PlusStat(stat: number): { total: number; dice: [number, number] } {
  const d1 = 1 + Math.floor(Math.random() * 6)
  const d2 = 1 + Math.floor(Math.random() * 6)
  const total = d1 + d2 + stat
  return { total, dice: [d1, d2] }
}

/** Interpret roll result per Dungeon World rules */
export function interpretRoll(total: number): 'full' | 'partial' | 'failure' {
  if (total >= 10) return 'full'
  if (total >= 7) return 'partial'
  return 'failure'
}
