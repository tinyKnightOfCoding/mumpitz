import type { Verification } from '@/users/types'

export async function createEmailVerification(_email: string): Promise<Verification> {
  throw new Error('Not implemented')
}
