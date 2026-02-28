import { Pool, types } from 'pg'
import { Temporal } from 'temporal-polyfill'
import { z } from 'zod'

types.setTypeParser(types.builtins.TIMESTAMPTZ, (value: string) => Temporal.ZonedDateTime.from(value))
types.setTypeParser(types.builtins.DATE, (value: string) => Temporal.PlainDate.from(value))

export async function createPool(): Promise<Pool> {
  const connectionString = z.string().parse(process.env.DATABASE_URL)
  return new Pool({
    connectionString,
  })
}
