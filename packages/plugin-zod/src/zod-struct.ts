import { AnyObject, Json } from '@mumpitz/common'
import { UnknownKeysParam, ZodEffects, ZodObject, ZodRawShape, ZodTypeAny } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

export type ZodStructConstructor<O = unknown, I extends Json = Json> = {
  new (value: O): ZodStructInstance<O>
  shape<T extends ZodStructInstance<O>>(
    this: new (values: O) => T,
  ): ZodEffects<ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, O, I>, T, I>
  deserialize<T extends ZodStructInstance<O>>(this: new (values: O) => T, data: Json): T
}

export type ZodStructInstance<O = unknown> = Copyable<O> & Readonly<O>

export function ZodStruct<O extends AnyObject, I extends Json = Json>(
  shape: ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, O, I>,
): ZodStructConstructor<O, I> {
  class _ZodStruct extends ZodStructBase<O> {
    static shape<T extends ZodStructInstance<O>>(
      this: new (values: O) => T,
    ): ZodEffects<ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, O, I>, T, I> {
      return shape.transform(data => new this(data))
    }

    static deserialize<T extends ZodStructInstance<O>>(this: new (values: O) => T, data: Json): T {
      return shape.transform(data => new this(data)).parse(data)
    }
  }
  return _ZodStruct as unknown as ZodStructConstructor<O, I>
}

class ZodStructBase<O extends AnyObject> implements Copyable<O> {
  constructor(values: O) {
    const descriptors = toReadonlyPropertyDescriptorMap(values)
    Object.defineProperties(this, descriptors)
  }

  copy(overrides: Partial<O> = {}): this {
    return Reflect.construct(this.constructor, [{ ...this, ...overrides }])
  }
}
