import { Json, UnknownObject } from '@mumpitz/common'
import { z, ZodObject, ZodRawShape } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

type Output<Z extends ZodRawShape> = z.output<ZodObject<Z>>

export type ZodStructType<Z extends ZodRawShape> = {
  new (value: Output<Z>): Readonly<Output<Z>> & Copyable<Output<Z>>

  readonly schema: ZodObject<Z>

  parse(raw: Json): Output<Z>
}

export function ZodStruct<Z extends ZodRawShape>(shape: Z): ZodStructType<Z> {
  class _ZodStruct extends ZodStructBase<Output<Z>> {
    static readonly schema = z.object(shape)

    static parse(raw: Json): Output<Z> {
      return this.schema.parse(raw)
    }
  }
  return _ZodStruct as unknown as ZodStructType<Z>
}

class ZodStructBase<O extends UnknownObject> implements Copyable<O> {
  constructor(values: O) {
    const descriptors = toReadonlyPropertyDescriptorMap(values)
    Object.defineProperties(this, descriptors)
  }

  copy(overrides: Partial<O> = {}): this {
    return Reflect.construct(this.constructor, [{ ...this, ...overrides }])
  }
}
