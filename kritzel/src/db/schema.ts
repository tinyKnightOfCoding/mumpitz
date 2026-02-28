import type { Generated } from 'kysely'
import type { Temporal } from 'temporal-polyfill'

export type UserTable = {
  id: string
  email: string
  name: string
  emailVerifiedAt: Temporal.ZonedDateTime | null
  createdAt: Generated<Temporal.ZonedDateTime>
  updatedAt: Generated<Temporal.ZonedDateTime>
}

export type SessionTable = {
  id: string
  userId: string
  refreshTokenHash: string
  expiresAt: Temporal.ZonedDateTime
  createdAt: Generated<Temporal.ZonedDateTime>
  updatedAt: Generated<Temporal.ZonedDateTime>
}

export type VerificationTable = {
  id: string
  userId: string
  type: 'registration' | 'email-change'
  value: string
  otpHash: string
  attemptCount: number
  expiredAt: Temporal.ZonedDateTime
  createdAt: Generated<Temporal.ZonedDateTime>
  updatedAt: Generated<Temporal.ZonedDateTime>
}

export type Schema = {
  users: UserTable
  sessions: SessionTable
  verifications: VerificationTable
}
