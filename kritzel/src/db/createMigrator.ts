import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { FileMigrationProvider, type Kysely, Migrator } from 'kysely'
import type { Schema } from '@/db/schema'

export function createMigrator(db: Kysely<Schema>): Migrator {
  const migrationFolder = path.join(__dirname, 'migrations')
  const provider = new FileMigrationProvider({ fs, path, migrationFolder })
  return new Migrator({ db, provider })
}
