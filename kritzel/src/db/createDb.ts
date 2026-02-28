import {
  CamelCasePlugin,
  HandleEmptyInListsPlugin,
  Kysely,
  PostgresDialect,
  replaceWithNoncontingentExpression,
} from 'kysely'
import { createPool } from '@/db/createPool'
import type { Schema } from '@/db/schema'

export function createDb(): Kysely<Schema> {
  const dialect = new PostgresDialect({ pool: createPool })
  const plugins = [
    new CamelCasePlugin(),
    new HandleEmptyInListsPlugin({ strategy: replaceWithNoncontingentExpression }),
  ]
  return new Kysely<Schema>({
    dialect,
    plugins,
  })
}
