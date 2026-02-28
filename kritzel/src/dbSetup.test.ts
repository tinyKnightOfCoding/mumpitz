import crypto from 'node:crypto'
import { test } from 'vitest'
import { useTransaction } from '@/db'
import { withTestContext } from '@/test'

test(
  'create user',
  withTestContext(async () => {
    const tx = await useTransaction()
    await tx
      .insertInto('users')
      .values([{ id: crypto.randomUUID(), email: 'kenni@example.com', name: 'Kenni' }])
      .returning(['id'])
      .execute()
  }),
)
