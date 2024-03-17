import { expectType, TypeEqual, TypeOf } from 'ts-expect'
import { Defined, isDefined } from '../../src'

describe('Defined', () => {
  it('should be assignable from any non nullish value', () => {
    expectType<Defined>("")
    expectType<Defined>(5)
    expectType<Defined>(() => {})
    expectType<Defined>({})
    expectType<Defined>([])
    expectType<Defined>(new Date())
  })

  it('should not be assignable from any non nullish value', () => {
    expectType<TypeOf<Defined, null>>(false)
    expectType<TypeOf<Defined, number | null>>(false)
    expectType<TypeOf<Defined, undefined>>(false)
    expectType<TypeOf<Defined, string | undefined>>(false)
  })
})

describe('isDefined', () => {
  const createSubject = () => 'Hello' as string | null

  it('should infer generic correctly', () => {
    const subject: string | null = createSubject()
    if(isDefined(subject)) {
      expectType<TypeEqual<string, typeof subject>>(true)
    } else {
      expectType<TypeEqual<null, typeof subject>>(true)
    }
  })

  it('should return true given subject is defined', () => {
    expect(isDefined("")).toBeTruthy()
    expect(isDefined(5)).toBeTruthy()
    expect(isDefined(() => {})).toBeTruthy()
    expect(isDefined({})).toBeTruthy()
    expect(isDefined([])).toBeTruthy()
    expect(isDefined(new Date())).toBeTruthy()
  })

  it('should return false given subject is not defined', () => {
    expect(isDefined(null)).toBeFalsy()
    expect(isDefined(undefined)).toBeFalsy()
  })
})