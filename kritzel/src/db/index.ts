import { provide, type Ref } from '@mumpitz/piks'
import type { ControlledTransaction, Kysely, Migrator } from 'kysely'
import { createDb } from '@/db/createDb'
import { createMigrator } from '@/db/createMigrator'
import type { Schema } from '@/db/schema'

const useDb: Ref<Kysely<Schema>> = provide({
  name: 'db',
  use: createDb,
  onDestroy: (db) => db.destroy(),
})

const useTransaction: Ref<ControlledTransaction<Schema>> = provide({
  name: 'db.transaction',
  scope: 'request',
  use: async () => {
    const db = await useDb()
    return db.startTransaction().execute()
  },
  onDestroy: async (tx, result) => {
    if (result.reason === 'success') {
      await tx.commit().execute()
    } else {
      await tx.rollback().execute()
    }
  },
})

const useMigrator: Ref<Migrator> = provide({
  name: 'db.migrator',
  use: async () => createMigrator(await useDb()),
})

export { useTransaction, useDb, useMigrator }
export * from '@/db/schema'
