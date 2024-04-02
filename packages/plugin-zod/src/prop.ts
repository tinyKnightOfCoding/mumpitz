import { z, ZodType } from 'zod'

export type ZodConstructor<Z extends ZodType, T> = {
  new (value: z.output<Z>): T
  schema: Z
}

export function prop<Z extends ZodType, T>(constructor: ZodConstructor<Z, T>) {
  return constructor.schema.transform(value => new constructor(value))
}
