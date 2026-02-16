import 'dotenv/config'
import { runGame } from './game/orchestrator.js'

async function main() {
  const prompt =
    process.argv.slice(2).join(' ') ||
    'Cyberpunk noir: a detective, a hacker, and a street soldier must extract a defecting corporate AI from a hostile takeover. Start in a rain-soaked warehouse meet.'

  console.log('\n📖 Initial prompt:')
  console.log(`   "${prompt}"`)

  await runGame(prompt)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
