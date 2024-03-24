import { JsonPrimitive, Serializable, serialize } from '@mumpitz/common'
import { ZodType, ZodTypeDef } from 'zod'

export type ZodValueConstructor<
  O = unknown,
  I extends JsonPrimitive | undefined = JsonPrimitive | undefined,
  Def extends ZodTypeDef = ZodTypeDef,
> = {
  new (value: O): ZodValueInstance<O>
  parse(raw: I): O
  readonly shape: ZodType<O, Def, I>
}

export type ZodValueInstance<O = unknown> = Serializable & { readonly value: O }

export function ZodValue<
  O = unknown,
  I extends JsonPrimitive | undefined = JsonPrimitive | undefined,
  Def extends ZodTypeDef = ZodTypeDef,
>(shape: ZodType<O, Def, I>): ZodValueConstructor<O, I> {
  class _ZodValue extends ZodValueBase<O> {
    static readonly shape = shape
    static parse(raw: I): O {
      return this.shape.parse(raw)
    }
  }
  return _ZodValue as ZodValueConstructor<O, I>
}

class ZodValueBase<O> implements Serializable {
  constructor(readonly value: O) {}

  toJSON() {
    return serialize(this.value)
  }
}
