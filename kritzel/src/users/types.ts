import type { Temporal } from 'temporal-polyfill'

export type User = {
  id: string
  name: string
  email: string
  isVerified: boolean
}

export type Verification = {
  otp: string
}

export type Session = {
  id: string
  accessToken: string
  refreshToken: string
  expiresAt: Temporal.ZonedDateTime
}
