import { AnyObject, Json } from '@mumpitz/common'
import { UnknownKeysParam, ZodEffects, ZodObject, ZodRawShape, ZodTypeAny } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

type ZodStructShape<O = unknown, I extends Json = Json> = ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, O, I>

type ZodStructProp<
  O = unknown,
  I extends Json = Json,
  T extends ZodStructInstance<O> = ZodStructInstance<O>,
> = ZodEffects<ZodStructShape<O, I>, T, I>

type ActualZodConstructor<O = unknown, I extends Json = Json, T extends ZodStructInstance<O> = ZodStructInstance<O>> = {
  new (values: O): T

  readonly shape: ZodStructShape<O, I>
}

export type ZodStructConstructor<O = unknown, I extends Json = Json> = {
  new (value: O): ZodStructInstance<O>

  readonly shape: ZodStructShape<O, I>

  prop<T extends ZodStructInstance<O>>(this: ActualZodConstructor<O, I, T>): ZodStructProp<O, I, T>

  deserialize<T extends ZodStructInstance<O>>(this: ActualZodConstructor<O, I, T>, data: Json): T
}

export type ZodStructInstance<O = unknown> = Copyable<O> & Readonly<O>

export function ZodStruct<O extends AnyObject, I extends Json = Json>(
  shape: ZodStructShape<O, I>,
): ZodStructConstructor<O, I> {
  class _ZodStruct extends ZodStructBase<O> {
    static readonly shape = shape
    static prop<T extends ZodStructInstance<O>>(this: ActualZodConstructor<O, I, T>): ZodStructProp<O, I, T> {
      return this.shape.transform(data => new this(data))
    }

    static deserialize<T extends ZodStructInstance<O>>(this: ActualZodConstructor<O, I, T>, data: Json): T {
      return this.shape.transform(data => new this(data)).parse(data)
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
