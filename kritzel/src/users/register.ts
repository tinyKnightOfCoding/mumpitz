import {
  cleanupExpiredRegistrations,
  createEmailVerification,
  createUnverifiedUser,
  existsUser,
  sendVerificationEmail,
} from '@/users/business'

export type RegisterRequest = {
  // TODO brand or value type?
  email: string
  name: string
}

export class EmailAlreadyTakenError extends Error {}

export async function register(req: RegisterRequest): Promise<void> {
  await cleanupExpiredRegistrations(req.email)
  const emailAlreadyTaken = await existsUser(req.email)
  if (emailAlreadyTaken) {
    throw new EmailAlreadyTakenError(req.email)
  }
  await Promise.all([await createUnverifiedUser(req), await createAndSendEmailVerification(req.email)])
}

async function createAndSendEmailVerification(email: string) {
  const { otp } = await createEmailVerification(email)
  await sendVerificationEmail({ otp, email })
}
