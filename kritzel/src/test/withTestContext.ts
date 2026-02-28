import { createContext } from '@mumpitz/piks'
import type { TestFunction } from 'vitest'
import { useMigrator } from '@/db'
import { useTestTransaction } from '@/test/useTestTransaction'

export const withTestContext =
  (fn: TestFunction): TestFunction =>
  async (...args) => {
    const context = createContext()
    try {
      return context.run(async () => {
        const migrator = await useMigrator()
        await migrator.migrateToLatest()
        // bind transaction immediately to override
        await useTestTransaction()
        return fn(...args)
      })
    } finally {
      await context.destroy()
    }
  }
