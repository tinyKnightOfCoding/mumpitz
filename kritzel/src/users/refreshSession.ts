import type { Session } from '@/users/types'

export type RefreshSessionRequest = { refreshToken: string }

export type RefreshSessionResponse = { session: Session }

export async function refreshSession(_req: RefreshSessionRequest): Promise<RefreshSessionResponse> {
  throw new Error('Not implemented')
}
