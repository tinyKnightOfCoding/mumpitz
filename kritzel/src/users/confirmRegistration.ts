import type { Session } from '@/users/types'

export type ConfirmRegistrationRequest = {
  email: string
  otp: string
}

export type ConfirmRegistrationResponse = {
  session: Session
}

export class NotFoundError extends Error {}

export class InvalidOtpError extends Error {} // Conflict?

export async function confirmRegistration(_req: ConfirmRegistrationRequest): Promise<ConfirmRegistrationResponse> {
  throw new Error('Not implemented')
}
//   const [user, verification] = await Promise.all([findUserByEmail(req.email), findEmailVerificationByEmail(req.email)])
//   if (!isDefined(user) || !isDefined(verification)) {
//     throw new NotFoundError(req.email)
//   }
//   const isVerified = verifyOtp(verification, req.otp)
//   if (!isvalid) {
//     await incrementAttemptOrExpire(req.email) // TODO this should persist on error
//     throw new InvalidOtpError(req.email)
//   }
//   const verifiedUser = verifyUser(user)
//   const session = await createSession(verifiedUser)
//   return { session }
// }
