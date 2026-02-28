import type { User } from '@/users/types'

export async function existsUser(_email: string): Promise<User> {
  throw new Error('Not implemented')
}
