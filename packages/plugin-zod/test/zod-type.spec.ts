import { Parser } from '@mumpitz/common'
import { ZodType } from 'zod'
import { expectType, TypeOf } from 'ts-expect'

describe('ZodType', () => {
  it('should be compatible with Parser', () => {
    expectType<TypeOf<Parser<unknown>, ZodType>>(true)
  })
})
