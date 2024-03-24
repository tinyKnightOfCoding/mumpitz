import { AnyObject, Json } from '@mumpitz/common'
import { UnknownKeysParam, ZodObject, ZodRawShape, ZodTypeAny } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

export type ZodStructConstructor<O = unknown, I extends Json = Json> = {
  new (value: O): ZodStructInstance<O>
  parse(raw: I): O
  readonly shape: ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, O, I>
}

export type ZodStructInstance<O = unknown> = Copyable<O> & Readonly<O>

export function ZodStruct<
  O extends AnyObject,
  T extends ZodRawShape,
  I extends Json = Json,
  UnknownKeys extends UnknownKeysParam = UnknownKeysParam,
  Catchall extends ZodTypeAny = ZodTypeAny,
>(shape: ZodObject<T, UnknownKeys, Catchall, O, I>): ZodStructConstructor<O, I> {
  class _ZodStruct extends ZodStructBase<O> {
    static readonly shape = shape
    static parse(raw: I): O {
      return this.shape.parse(raw)
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
