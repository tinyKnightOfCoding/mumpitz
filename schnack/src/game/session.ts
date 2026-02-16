import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SESSIONS_DIR = 'sessions'

export type SessionLogger = {
  sessionId: string
  dir: string
  write: (name: string, raw: string) => void
}

export function createSession(initialPrompt?: string): SessionLogger {
  const sessionId = randomUUID()
  const dir = join(process.cwd(), SESSIONS_DIR, sessionId)
  mkdirSync(dir, { recursive: true })

  if (initialPrompt) {
    writeFileSync(join(dir, '00-initial-prompt.txt'), initialPrompt, 'utf-8')
  }

  let counter = 0
  const write = (name: string, raw: string) => {
    counter++
    const filename = `${String(counter).padStart(2, '0')}-${name}.txt`
    const path = join(dir, filename)
    writeFileSync(path, raw, 'utf-8')
  }

  return { sessionId, dir, write }
}
