import { expectType, TypeOf } from 'ts-expect'
import { AnyObject } from '../../src'

describe('AnyObject', () => {
  it('should not be assignable by non objects', () => {
    expectType<TypeOf<AnyObject, string>>(false)
    expectType<TypeOf<AnyObject, number>>(false)
    expectType<TypeOf<AnyObject, null>>(false)
    expectType<TypeOf<AnyObject, undefined>>(false)
    expectType<TypeOf<AnyObject, unknown[]>>(false)
  })

  it('should be assignable by objects', () => {
    expectType<AnyObject>({})
    expectType<AnyObject>({ hello: 'World!' })
  })
})
