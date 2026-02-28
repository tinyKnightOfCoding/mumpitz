import type { User } from '@/users/types'

export async function createUnverifiedUser(
  _: Pick<User, 'email' | 'name'>, // TODO avoid inline types
): Promise<User> {
  throw new Error('Not implemented')
}
