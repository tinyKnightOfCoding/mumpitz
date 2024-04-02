import { expectType, TypeOf } from 'ts-expect'
import { UnknownObject } from '../../src'

describe('UnknownObject', () => {
  it('should not be assignable by non objects', () => {
    expectType<TypeOf<UnknownObject, string>>(false)
    expectType<TypeOf<UnknownObject, number>>(false)
    expectType<TypeOf<UnknownObject, null>>(false)
    expectType<TypeOf<UnknownObject, undefined>>(false)
    expectType<TypeOf<UnknownObject, unknown[]>>(false)
  })

  it('should be assignable by objects', () => {
    expectType<UnknownObject>({})
    expectType<UnknownObject>({ hello: 'World!' })
  })
})
