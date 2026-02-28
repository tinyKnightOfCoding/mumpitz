import { provide } from '@mumpitz/piks'
import { useDb, type useTransaction } from '@/db'

export const useTestTransaction: typeof useTransaction = provide({
  // reuse name to override
  name: 'db.transaction',
  scope: 'request',
  use: async () => {
    const db = await useDb()
    return db.startTransaction().execute()
  },
  onDestroy: async (tx) => {
    // always rollback
    await tx.rollback().execute()
  },
})
