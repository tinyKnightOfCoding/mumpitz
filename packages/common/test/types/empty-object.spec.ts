import { expectType, TypeOf } from 'ts-expect'
import { EmptyObject } from '../../src'

class EmptyClass {}

describe('EmptyObject', () => {
  it('should only be assignable from an object with no properties', () => {
    expectType<EmptyObject>({})
  })

  it('should not be assignable from any other value', () => {
    expectType<TypeOf<EmptyObject, EmptyClass>>(false)
    expectType<TypeOf<EmptyObject, Date[]>>(false)
    expectType<TypeOf<EmptyObject, null>>(false)
    expectType<TypeOf<EmptyObject, undefined>>(false)
    expectType<TypeOf<EmptyObject, string>>(false)
    expectType<TypeOf<EmptyObject, number>>(false)
    expectType<TypeOf<EmptyObject, () => void>>(false)
  })
})
