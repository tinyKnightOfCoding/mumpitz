import { z } from 'zod'

export type Email = z.infer<ReturnType<typeof emailProp>>

export function emailProp(): z.core.$ZodBranded<z.ZodEmail, 'Email'> {
  return z.email().normalize('NFKC').brand<'Email'>()
}
