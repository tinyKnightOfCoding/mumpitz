import { afterEach, describe, expect, test, vi } from 'vitest'
import { deferred } from './deferred'
import { once } from './once'

describe('once', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('calls callback on first invocation', () => {
    const callback = vi.fn(() => 'result')
    const wrapped = once(callback)
    const result = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result).toBe('result')
  })

  test('returns same result on subsequent invocations', () => {
    const callback = vi.fn(() => 'result')
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    const result3 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe('result')
    expect(result2).toBe('result')
    expect(result3).toBe('result')
  })

  test('caches successful result', () => {
    const callback = vi.fn(() => ({ id: 1, name: 'test' }))
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe(result2)
    expect(result1).toEqual({ id: 1, name: 'test' })
  })

  test('caches thrown error', () => {
    const error = new Error('Test error')
    const callback = vi.fn(() => {
      throw error
    })
    const wrapped = once(callback)
    expect(() => wrapped()).toThrow(error)
    expect(() => wrapped()).toThrow(error)
    expect(() => wrapped()).toThrow(error)
    expect(callback).toHaveBeenCalledOnce()
  })

  test('preserves function arguments', () => {
    const callback = vi.fn((a: number, b: string, c: boolean) => {
      return `${a}-${b}-${c}`
    })
    const wrapped = once(callback)
    const result = wrapped(1, 'test', true)
    expect(callback).toHaveBeenCalledWith(1, 'test', true)
    expect(result).toBe('1-test-true')
  })

  test('preserves function arguments on subsequent calls', () => {
    const callback = vi.fn((a: number, b: string) => a + b.length)
    const wrapped = once(callback)
    wrapped(1, 'test')
    wrapped(2, 'different')
    wrapped(3, 'args')
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(1, 'test')
  })

  test('handles async callbacks', async () => {
    const def = deferred<void>()
    const callback = vi.fn(async () => {
      await def.promise
      return 'async-result'
    })
    const wrapped = once(callback)
    const promise1 = wrapped()
    const promise2 = wrapped()
    const promise3 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    def.resolve()
    const result1 = await promise1
    const result2 = await promise2
    const result3 = await promise3
    expect(result1).toBe('async-result')
    expect(result2).toBe('async-result')
    expect(result3).toBe('async-result')
  })

  test('returns same promise reference for async callbacks', async () => {
    const def = deferred<void>()
    const callback = vi.fn(async () => {
      await def.promise
      return 'async-result'
    })
    const wrapped = once(callback)
    const promise1 = wrapped()
    const promise2 = wrapped()
    const promise3 = wrapped()
    expect(promise1).toBe(promise2)
    expect(promise2).toBe(promise3)
    expect(callback).toHaveBeenCalledOnce()
    def.resolve()
    await promise1
  })

  test('handles callback that returns undefined', () => {
    const callback = vi.fn(() => undefined)
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBeUndefined()
    expect(result2).toBeUndefined()
  })

  test('handles callback that returns null', () => {
    const callback = vi.fn(() => null)
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('handles callback that returns zero', () => {
    const callback = vi.fn(() => 0)
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe(0)
    expect(result2).toBe(0)
  })

  test('handles callback that returns false', () => {
    const callback = vi.fn(() => false)
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe(false)
    expect(result2).toBe(false)
  })

  test('handles callback that returns empty string', () => {
    const callback = vi.fn(() => '')
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe('')
    expect(result2).toBe('')
  })

  test('handles multiple arguments with different types', () => {
    const callback = vi.fn((a: number, b: string, c: boolean, d: object) => {
      return { a, b, c, d }
    })
    const wrapped = once(callback)
    const obj = { id: 1 }
    const result = wrapped(1, 'test', true, obj)
    expect(callback).toHaveBeenCalledWith(1, 'test', true, obj)
    expect(result).toEqual({ a: 1, b: 'test', c: true, d: obj })
  })

  test('handles no arguments', () => {
    const callback = vi.fn(() => 'no-args')
    const wrapped = once(callback)
    const result = wrapped()
    expect(callback).toHaveBeenCalledWith()
    expect(result).toBe('no-args')
  })

  test('handles error with message', () => {
    const error = new Error('Custom error message')
    const callback = vi.fn(() => {
      throw error
    })
    const wrapped = once(callback)
    expect(() => wrapped()).toThrow('Custom error message')
    expect(() => wrapped()).toThrow('Custom error message')
    expect(callback).toHaveBeenCalledOnce()
  })

  test('handles string error', () => {
    const callback = vi.fn(() => {
      throw 'string error'
    })
    const wrapped = once(callback)
    expect(() => wrapped()).toThrow('string error')
    expect(() => wrapped()).toThrow('string error')
    expect(callback).toHaveBeenCalledOnce()
  })

  test('handles number error', () => {
    const callback = vi.fn(() => {
      throw 42
    })
    const wrapped = once(callback)
    try {
      wrapped()
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBe(42)
    }
    try {
      wrapped()
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBe(42)
    }
    expect(callback).toHaveBeenCalledOnce()
  })

  test('handles complex return value', () => {
    const complexValue = {
      id: 1,
      nested: {
        array: [1, 2, 3],
        map: new Map([['key', 'value']]),
      },
    }
    const callback = vi.fn(() => complexValue)
    const wrapped = once(callback)
    const result1 = wrapped()
    const result2 = wrapped()
    expect(callback).toHaveBeenCalledOnce()
    expect(result1).toBe(complexValue)
    expect(result2).toBe(complexValue)
    expect(result1).toBe(result2)
  })

  test('maintains function signature', () => {
    const callback = (a: number, b: string): string => `${a}-${b}`
    const wrapped = once(callback)
    // TypeScript should accept the same signature
    const result: string = wrapped(1, 'test')
    expect(result).toBe('1-test')
  })
})
