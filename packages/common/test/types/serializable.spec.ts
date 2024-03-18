import { isSerializable, serialize } from '../../src'

describe('isSerializable', () => {
  it('should return false for any non object without toJSON property', () => {
    expect(isSerializable('')).toBeFalsy()
    expect(isSerializable(() => {})).toBeFalsy()
    expect(isSerializable(5)).toBeFalsy()
    expect(isSerializable(null)).toBeFalsy()
    expect(isSerializable(undefined)).toBeFalsy()
    expect(isSerializable([])).toBeFalsy()
    expect(isSerializable({})).toBeFalsy()
  })

  it('should return false for any object with toJSON property not being a function', () => {
    expect(isSerializable({toJSON: 'Hello'})).toBeFalsy()
    expect(isSerializable({toJSON: 5})).toBeFalsy()
    expect(isSerializable({toJSON: {}})).toBeFalsy()
    expect(isSerializable({toJSON: undefined})).toBeFalsy()
    expect(isSerializable({toJSON: null})).toBeFalsy()
  })

  it('should return false for any toJSON function with parameters', () => {
    expect(isSerializable({toJSON: (hello: string) => hello})).toBeFalsy()
    expect(isSerializable({toJSON: (hello: string, world: number) => hello})).toBeFalsy()
  })

  it('should return true for a a toJSON function callable without parameters', () => {
    expect(isSerializable({toJSON: () => 'Hello'})).toBeTruthy()
    expect(isSerializable({toJSON: (...args: string[]) => args})).toBeTruthy()
  })
})

describe('serialize', () => {
  it('should return input does not implement Serializable', () => {
    expect(serialize('Hello')).toEqual('Hello')
    expect(serialize(null)).toEqual(null)
    expect(serialize(undefined)).toEqual(undefined)
    expect(serialize(15)).toEqual(15)
    expect(serialize({hello: 'World'})).toEqual({ hello: 'World' })
  })

  it('should return result of toJSON given input implements Serializable', () => {
    expect(serialize({toJSON: () => 'Hello, World!'})).toEqual('Hello, World!')
  })
})