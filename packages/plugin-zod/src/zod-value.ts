import { Serializable, serialize } from '@mumpitz/common'
import { z, ZodType } from 'zod'

type Output<Z extends ZodType> = z.output<Z>

export type ZodValueType<Z extends ZodType> = {
  new (value: Output<Z>): Serializable & { readonly value: Output<Z> }

  readonly schema: Z
}

export function ZodValue<Z extends ZodType>(shape: Z): ZodValueType<Z> {
  class _ZodValue implements Serializable {
    static readonly schema = shape

    constructor(readonly value: Output<Z>) {}

    toJSON() {
      return serialize(this.value)
    }
  }
  return _ZodValue
}
