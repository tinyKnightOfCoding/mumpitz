import { Json, UnknownObject } from '@mumpitz/common'
import { UnknownKeysParam, z, ZodEffects, ZodObject, ZodRawShape, ZodTypeAny } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

type ZodStructShape<
  Z extends ZodRawShape,
  O extends UnknownObject = z.output<ZodObject<Z>>,
  I extends Json = z.input<ZodObject<Z>>,
> = ZodObject<Z, UnknownKeysParam, ZodTypeAny, O, I>

type ZodStructProp<
  Z extends ZodRawShape,
  O extends UnknownObject = z.output<ZodObject<Z>>,
  I extends Json = z.input<ZodObject<Z>>,
  T extends ZodStructInstance<O> = ZodStructInstance<O>,
> = ZodEffects<ZodStructShape<Z, O, I>, T, I>

type ActualZodConstructor<
  Z extends ZodRawShape,
  O extends UnknownObject = z.output<ZodObject<Z>>,
  I extends Json = z.input<ZodObject<Z>>,
  T extends ZodStructInstance<O> = ZodStructInstance<O>,
> = {
  new (values: O): T

  readonly schema: ZodStructShape<Z, O, I>
}

export type ZodStructConstructor<
  Z extends ZodRawShape,
  O extends UnknownObject = z.output<ZodObject<Z>>,
  I extends Json = z.input<ZodObject<Z>>,
> = {
  new (value: O): ZodStructInstance<O>

  readonly schema: ZodStructShape<Z, O, I>

  prop<T extends ZodStructInstance<O>>(this: ActualZodConstructor<Z, O, I, T>): ZodStructProp<Z, O, I, T>

  deserialize<T extends ZodStructInstance<O>>(this: ActualZodConstructor<Z, O, I, T>, data: Json): T
}

export function ZodStruct<
  Z extends ZodRawShape,
  O extends UnknownObject = z.output<ZodObject<Z>>,
  I extends Json = z.input<ZodObject<Z>>,
>(shape: Z): ZodStructConstructor<Z, O, I> {
  class _ZodStruct extends ZodStructBase<O> {
    static readonly schema = z.object(shape)

    static prop<T extends ZodStructInstance<O>>(this: ActualZodConstructor<Z, O, I, T>): ZodStructProp<Z, O, I, T> {
      return this.schema.transform(data => new this(data))
    }

    static deserialize<T extends ZodStructInstance<O>>(this: ActualZodConstructor<Z, O, I, T>, data: Json): T {
      return new this(this.schema.parse(data))
    }
  }
  return _ZodStruct as unknown as ZodStructConstructor<Z, O, I>
}

export type ZodStructInstance<O = unknown> = Copyable<O> & Readonly<O>

class ZodStructBase<O extends UnknownObject> implements Copyable<O> {
  constructor(values: O) {
    const descriptors = toReadonlyPropertyDescriptorMap(values)
    Object.defineProperties(this, descriptors)
  }

  copy(overrides: Partial<O> = {}): this {
    return Reflect.construct(this.constructor, [{ ...this, ...overrides }])
  }
}
