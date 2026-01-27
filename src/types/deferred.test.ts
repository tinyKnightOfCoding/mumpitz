import { afterEach, describe, expect, test, vi } from 'vitest'
import { Deferred, deferred } from './deferred'

describe('Deferred', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('resolves promise with value', async () => {
    const def = new Deferred<string>()
    def.resolve('test-value')
    const result = await def.promise
    expect(result).toBe('test-value')
  })

  test('rejects promise with error', async () => {
    const def = new Deferred<string>()
    const error = new Error('Test error')
    def.reject(error)
    await expect(def.promise).rejects.toBe(error)
  })

  test('tracks resolved state', async () => {
    const def = new Deferred<string>()
    expect(def.state).toBe('pending')
    def.resolve('value')
    expect(def.state).toBe('resolved')
  })

  test('tracks rejected state', async () => {
    const def = new Deferred<string>()
    expect(def.state).toBe('pending')
    def.reject(new Error('error'))
    expect(def.state).toBe('rejected')
    // Handle the rejection to avoid unhandled promise rejection
    try {
      await def.promise
    } catch {
      // Expected
    }
  })

  test('tracks pending state initially', () => {
    const def = new Deferred<string>()
    expect(def.state).toBe('pending')
    expect(def.isCompleted).toBe(false)
  })

  test('stores resolved value', async () => {
    const def = new Deferred<{ id: number }>()
    const value = { id: 1 }
    def.resolve(value)
    await def.promise
    expect(def.value).toBe(value)
  })

  test('stores rejection error', async () => {
    const def = new Deferred<string>()
    const error = new Error('Test error')
    def.reject(error)
    try {
      await def.promise
    } catch {
      // Expected
    }
    expect(def.error).toBe(error)
  })

  test('indicates completion status', async () => {
    const def = new Deferred<string>()
    expect(def.isCompleted).toBe(false)
    def.resolve('value')
    expect(def.isCompleted).toBe(true)
    await def.promise
    expect(def.isCompleted).toBe(true)
  })

  test('indicates completion status after rejection', async () => {
    const def = new Deferred<string>()
    expect(def.isCompleted).toBe(false)
    def.reject(new Error('error'))
    expect(def.isCompleted).toBe(true)
    try {
      await def.promise
    } catch {
      // Expected
    }
    expect(def.isCompleted).toBe(true)
  })

  test('ignores multiple resolves', async () => {
    const def = new Deferred<string>()
    def.resolve('first')
    def.resolve('second')
    def.resolve('third')
    const result = await def.promise
    expect(result).toBe('first')
    expect(def.value).toBe('first')
  })

  test('ignores multiple rejects', async () => {
    const def = new Deferred<string>()
    const error1 = new Error('error1')
    const error2 = new Error('error2')
    def.reject(error1)
    def.reject(error2)
    await expect(def.promise).rejects.toBe(error1)
    expect(def.error).toBe(error1)
    // Promise is already handled by expect().rejects
  })

  test('ignores reject after resolve', async () => {
    const def = new Deferred<string>()
    def.resolve('value')
    def.reject(new Error('error'))
    const result = await def.promise
    expect(result).toBe('value')
    expect(def.value).toBe('value')
    expect(def.state).toBe('resolved')
    // Rejection is ignored, so promise is already resolved
  })

  test('ignores resolve after reject', async () => {
    const def = new Deferred<string>()
    const error = new Error('error')
    def.reject(error)
    def.resolve('value')
    await expect(def.promise).rejects.toBe(error)
    expect(def.error).toBe(error)
    expect(def.state).toBe('rejected')
    // Promise is already handled by expect().rejects
  })

  test('handles undefined rejection reason', async () => {
    const def = new Deferred<string>()
    def.reject()
    await expect(def.promise).rejects.toBeUndefined()
    expect(def.error).toBeUndefined()
    // Promise is already handled by expect().rejects
  })

  test('handles null rejection reason', async () => {
    const def = new Deferred<string>()
    def.reject(null)
    await expect(def.promise).rejects.toBeNull()
    expect(def.error).toBeNull()
    // Promise is already handled by expect().rejects
  })

  test('handles string rejection reason', async () => {
    const def = new Deferred<string>()
    def.reject('string error')
    await expect(def.promise).rejects.toBe('string error')
    expect(def.error).toBe('string error')
    // Promise is already handled by expect().rejects
  })

  test('handles complex resolved value', async () => {
    const def = new Deferred<{ id: number; data: string[] }>()
    const value = { id: 1, data: ['a', 'b', 'c'] }
    def.resolve(value)
    const result = await def.promise
    expect(result).toEqual(value)
    expect(def.value).toEqual(value)
  })

  test('deferred factory function creates instance', () => {
    const def = deferred<string>()
    expect(def).toBeInstanceOf(Deferred)
    expect(def.state).toBe('pending')
  })

  test('maintains state consistency', async () => {
    const def = new Deferred<number>()
    expect(def.state).toBe('pending')
    expect(def.isCompleted).toBe(false)
    expect(def.value).toBeUndefined()
    expect(def.error).toBeUndefined()
    def.resolve(42)
    expect(def.state).toBe('resolved')
    expect(def.isCompleted).toBe(true)
    expect(def.value).toBe(42)
    expect(def.error).toBeUndefined()
    await def.promise
    expect(def.state).toBe('resolved')
    expect(def.isCompleted).toBe(true)
    expect(def.value).toBe(42)
  })

  test('maintains state consistency after rejection', async () => {
    const def = new Deferred<number>()
    expect(def.state).toBe('pending')
    expect(def.isCompleted).toBe(false)
    const error = new Error('test')
    def.reject(error)
    expect(def.state).toBe('rejected')
    expect(def.isCompleted).toBe(true)
    expect(def.value).toBeUndefined()
    expect(def.error).toBe(error)
    try {
      await def.promise
    } catch {
      // Expected
    }
    expect(def.state).toBe('rejected')
    expect(def.isCompleted).toBe(true)
    expect(def.value).toBeUndefined()
    expect(def.error).toBe(error)
  })
})
