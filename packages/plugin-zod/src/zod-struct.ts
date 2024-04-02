import { z, ZodObject, ZodRawShape } from 'zod'
import { toReadonlyPropertyDescriptorMap } from './to-readonly-property-discriptor-map'
import { Copyable } from './copyable'

type Output<Z extends ZodRawShape> = z.output<ZodObject<Z>>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface ZodStructType<Z extends ZodRawShape> {
  new (value: Output<Z>): Readonly<Output<Z>> & Copyable<Output<Z>>

  readonly schema: ZodObject<Z>
}

export function ZodStruct<Z extends ZodRawShape>(shape: Z): ZodStructType<Z> {
  class _ZodStruct implements Copyable<Output<Z>> {
    static readonly schema = z.object(shape)

    constructor(values: Output<Z>) {
      const descriptors = toReadonlyPropertyDescriptorMap(values)
      Object.defineProperties(this, descriptors)
    }

    copy(overrides: Partial<Output<Z>> = {}): this {
      return Reflect.construct(this.constructor, [{ ...this, ...overrides }])
    }
  }
  return _ZodStruct as unknown as ZodStructType<Z>
}
