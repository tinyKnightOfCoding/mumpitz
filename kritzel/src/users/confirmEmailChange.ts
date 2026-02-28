import type { Session } from '@/users/types'

export type ConfirmEmailChangeRequest = {
  newEmail: string
  otp: string
}

export type ConfirmEmailChangeResponse = {
  session: Session
}

export async function confirmEmailChange(_req: ConfirmEmailChangeRequest): Promise<ConfirmEmailChangeResponse> {
  throw new Error('Not implemented')
}
