import type { Session } from '@/users/types'

export type ConfirmLoginRequest = {
  email: string
  otp: string
}

export type ConfirmLoginResponse = {
  session: Session
}

export async function confirmLogin(_req: ConfirmLoginRequest): Promise<ConfirmLoginResponse> {
  throw new Error('Not implemented')
}
