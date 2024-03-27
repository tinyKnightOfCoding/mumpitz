import { JsonPrimitive, Serializable, serialize } from '@mumpitz/common'
import { z, ZodEffects, ZodType } from 'zod'

type ZodValueProp<
  Z extends ZodType,
  O = z.output<Z>,
  I extends JsonPrimitive = z.input<Z>,
  T extends ZodValueInstance<O> = ZodValueInstance<O>,
> = ZodEffects<Z, T, I>

type ActualZodValueConstructor<
  Z extends ZodType,
  O = z.output<Z>,
  T extends ZodValueInstance<O> = ZodValueInstance<O>,
> = {
  new (value: O): T

  readonly schema: Z
}

export type ZodValueConstructor<Z extends ZodType, O = z.output<Z>, I extends JsonPrimitive = z.input<Z>> = {
  new (value: O): ZodValueInstance<O>

  readonly schema: Z

  prop<T extends ZodValueInstance<O>>(this: ActualZodValueConstructor<Z, O, T>): ZodValueProp<Z, O, I, T>

  deserialize<T extends ZodValueInstance<O>>(this: ActualZodValueConstructor<Z, O, T>, data: JsonPrimitive): T
}

export type ZodValueInstance<O = unknown> = Serializable & { readonly value: O }

export function ZodValue<Z extends ZodType, O = z.output<Z>, I extends JsonPrimitive = z.input<Z>>(
  shape: Z,
): ZodValueConstructor<Z, O, I> {
  class _ZodValue implements ZodValueInstance<O> {
    static readonly schema = shape

    constructor(readonly value: O) {}

    static prop<T extends ZodValueInstance<O>>(this: ActualZodValueConstructor<Z, O, T>): ZodValueProp<Z, O, I, T> {
      return this.schema.transform(data => new this(data))
    }

    static deserialize<T extends ZodValueInstance<O>>(
      this: ActualZodValueConstructor<Z, O, T>,
      data: JsonPrimitive,
    ): T {
      return new this(this.schema.parse(data))
    }

    toJSON() {
      return serialize(this.value)
    }
  }
  return _ZodValue
}
