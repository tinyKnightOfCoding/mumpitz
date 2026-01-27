import { assertType, describe, expect, test } from 'vitest'
import { isDefined } from './defined'

// Helper factory functions to prevent automatic type narrowing
const nullable = <T>(value: T): T | null => value
const optional = <T>(value: T): T | undefined => value
const nullish = <T>(value: T): T | null | undefined => value

describe('isDefined', () => {
  test('returns true given defined subject', () => {
    expect(isDefined('')).toBeTruthy()
    expect(isDefined(0)).toBeTruthy()
    expect(isDefined(false)).toBeTruthy()
    expect(isDefined([])).toBeTruthy()
    expect(isDefined({})).toBeTruthy()
  })

  test('returns false given undefined', () => {
    const value = optional(undefined)
    expect(isDefined(value)).toBeFalsy()
    if (!isDefined(value)) {
      assertType<undefined>(value)
    }
  })

  test('returns false given null', () => {
    const value = nullable(null)
    expect(isDefined(value)).toBeFalsy()
    if (!isDefined(value)) {
      assertType<null>(value)
    }
  })

  test('type checks null or undefined in else branch', () => {
    const value = nullish('test')
    if (isDefined(value)) {
      assertType<string>(value)
    } else {
      assertType<null | undefined>(value)
    }
  })

  test('narrows type correctly for string', () => {
    const value = nullish('test')
    if (isDefined(value)) {
      assertType<string>(value)
      expect(value).toBe('test')
    }
  })

  test('narrows type correctly for number', () => {
    const value = nullish(42)
    if (isDefined(value)) {
      assertType<number>(value)
      expect(value).toBe(42)
    }
  })

  test('narrows type correctly for object', () => {
    const value = nullish({ foo: 'bar' })
    if (isDefined(value)) {
      assertType<{ foo: string }>(value)
      expect(value.foo).toBe('bar')
    }
  })

  test('narrows type correctly for array', () => {
    const value = nullish(['a', 'b'])
    if (isDefined(value)) {
      assertType<string[]>(value)
      expect(value.length).toBe(2)
    }
  })

  test('works with filter to remove undefined and null', () => {
    const arr = [1, undefined, 2, null, 3]
    const filtered = arr.filter(isDefined)
    assertType<number[]>(filtered)
    expect(filtered).toEqual([1, 2, 3])
  })
})
