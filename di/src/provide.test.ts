import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest'
import { createContext, type ProvideOptions, provide } from './index'
import { deferred } from './types/deferred'

describe('provide', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('creates ref with default root scope', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
      use: () => 'value',
    })
    await context.run(async () => {
      const result = await ref()
      expect(result).toBe('value')
      expect(ref.isBound()).toBe(true)
    })
  })

  test('creates ref with explicit root scope', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
      scope: 'root',
      use: () => 'value',
    })
    await context.run(async () => {
      const result = await ref()
      expect(result).toBe('value')
      expect(ref.isBound()).toBe(true)
    })
  })

  test('creates ref with request scope', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
      scope: 'request',
      use: () => 'value',
    })
    await context.run(async () => {
      const result = await ref()
      expect(result).toBe('value')
      expect(ref.isBound()).toBe(true)
    })
  })

  test('resolves value using factory', async () => {
    const context = createContext()
    const value = { id: 1, name: 'test' }
    const factory = vi.fn(() => value)
    const ref = provide({
      name: 'test',
      use: factory,
    })
    await context.run(async () => {
      const result = await ref()
      expect(result).toBe(value)
      expect(factory).toHaveBeenCalledOnce()
    })
  })

  test('throws when resolving without factory', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
    })
    await context.run(async () => {
      await expect(ref()).rejects.toThrow('Ref test has no factory')
    })
  })

  test('binds value using bindTo', async () => {
    const context = createContext()
    const factory = vi.fn(() => 'factory-value')
    const ref = provide({
      name: 'test',
      use: factory,
    })
    await context.run(async () => {
      ref.bindTo('bound-value')
      const result = await ref()
      expect(result).toBe('bound-value')
      // Factory should not be called when using bindTo
      expect(factory).not.toHaveBeenCalled()
    })
  })

  test('checks bound status', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
      use: () => 'value',
    })
    await context.run(async () => {
      expect(ref.isBound()).toBe(false)
      await ref()
      expect(ref.isBound()).toBe(true)
    })
  })

  test('uses unique symbol per name', async () => {
    const context = createContext()
    const ref1 = provide({
      name: 'service1',
      use: () => 'value1',
    })
    const ref2 = provide({
      name: 'service2',
      use: () => 'value2',
    })
    await context.run(async () => {
      const result1 = await ref1()
      const result2 = await ref2()
      expect(result1).toBe('value1')
      expect(result2).toBe('value2')
      expect(ref1.isBound()).toBe(true)
      expect(ref2.isBound()).toBe(true)
    })
  })

  test('passes onDestroy callback for root scope', async () => {
    const context = createContext()
    const value = { id: 1 }
    const onDestroy = vi.fn()
    const ref = provide({
      name: 'test',
      scope: 'root',
      use: () => value,
      onDestroy,
    })
    await context.run(async () => {
      await ref()
    })
    await context.destroy()
    expect(onDestroy).toHaveBeenCalledWith(value)
  })

  test('passes onDestroy callback for request scope', async () => {
    const context = createContext()
    const value = { id: 1 }
    const onDestroy = vi.fn()
    const ref = provide({
      name: 'test',
      scope: 'request',
      use: () => value,
      onDestroy,
    })
    await context.run(async () => {
      await ref()
    })
    // Request scope bindings are destroyed when run completes
    expect(onDestroy).toHaveBeenCalledWith(value, { reason: 'success', result: undefined })
  })

  test('passes error RequestResult to request scope onDestroy', async () => {
    const context = createContext()
    const value = { id: 1 }
    const onDestroy = vi.fn()
    const ref = provide({
      name: 'test',
      scope: 'request',
      use: () => value,
      onDestroy,
    })
    const error = new Error('Test error')
    try {
      await context.run(async () => {
        await ref()
        throw error
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBe(error)
    }
    expect(onDestroy).toHaveBeenCalledWith(value, { reason: 'error', error })
  })

  test('resolves bindTo value immediately', async () => {
    const context = createContext()
    const ref = provide({
      name: 'test',
      use: () => 'factory-value',
    })
    await context.run(async () => {
      ref.bindTo('bound-value')
      // bindTo should resolve immediately
      const result = await ref()
      expect(result).toBe('bound-value')
    })
  })

  test('handles async factory functions', async () => {
    const context = createContext()
    const value = { id: 1 }
    const def = deferred<void>()
    const factory = vi.fn(async () => {
      await def.promise
      return value
    })
    const ref = provide({
      name: 'test',
      use: factory,
    })
    const resultPromise = context.run(async () => {
      return await ref()
    })
    def.resolve()
    const result = await resultPromise
    expect(result).toBe(value)
    expect(factory).toHaveBeenCalledOnce()
  })

  test('reuses same binding for same ref', async () => {
    const context = createContext()
    const factory = vi.fn(() => 'value')
    const ref = provide({
      name: 'test',
      use: factory,
    })
    await context.run(async () => {
      const result1 = await ref()
      const result2 = await ref()
      expect(result1).toBe(result2)
      expect(factory).toHaveBeenCalledOnce()
    })
  })

  test('handles promise rejection in factory', async () => {
    const context = createContext()
    const error = new Error('Factory error')
    const ref = provide({
      name: 'test',
      use: () => Promise.reject(error),
    })
    await context.run(async () => {
      await expect(ref()).rejects.toBe(error)
    })
  })

  test('handles promise rejection in onDestroy callback', async () => {
    const context = createContext()
    const value = { id: 1 }
    const error = new Error('Destroy error')
    const onDestroy = vi.fn(async () => {
      throw error
    })
    const ref = provide({
      name: 'test',
      scope: 'root',
      use: () => value,
      onDestroy,
    })
    await context.run(async () => {
      await ref()
    })
    // Destroy should not throw, but callback error is caught
    await expect(context.destroy()).resolves.toBeUndefined()
    expect(onDestroy).toHaveBeenCalled()
  })

  test('creates different refs for different names', async () => {
    const context = createContext()
    const ref1 = provide({
      name: 'service1',
      use: () => 'value1',
    })
    const ref2 = provide({
      name: 'service2',
      use: () => 'value2',
    })
    await context.run(async () => {
      expect(ref1.isBound()).toBe(false)
      expect(ref2.isBound()).toBe(false)
      await ref1()
      expect(ref1.isBound()).toBe(true)
      expect(ref2.isBound()).toBe(false)
      await ref2()
      expect(ref1.isBound()).toBe(true)
      expect(ref2.isBound()).toBe(true)
    })
  })

  test('shares root scope bindings across runs', async () => {
    const context = createContext()
    const factory = vi.fn(() => 'value')
    const ref = provide({
      name: 'test',
      scope: 'root',
      use: factory,
    })
    await context.run(async () => {
      await ref()
    })
    await context.run(async () => {
      const result = await ref()
      expect(result).toBe('value')
    })
    expect(factory).toHaveBeenCalledOnce()
  })

  test('isolates request scope bindings per run', async () => {
    const context = createContext()
    const factory1 = vi.fn(() => 'value1')
    const factory2 = vi.fn(() => 'value2')
    const ref = provide({
      name: 'test',
      scope: 'request',
      use: factory1,
    })
    await context.run(async () => {
      const result1 = await ref()
      expect(result1).toBe('value1')
    })
    // Change factory for next run
    const ref2 = provide({
      name: 'test',
      scope: 'request',
      use: factory2,
    })
    await context.run(async () => {
      const result2 = await ref2()
      expect(result2).toBe('value2')
    })
    expect(factory1).toHaveBeenCalledOnce()
    expect(factory2).toHaveBeenCalledOnce()
  })

  test('rejects functions as provide options', () => {
    expectTypeOf(() => 'hello').not.toMatchTypeOf<ProvideOptions<string>>()
    expectTypeOf(async () => 'hello').not.toMatchTypeOf<ProvideOptions<string>>()
    expectTypeOf(function named() {
      return 'hello'
    }).not.toMatchTypeOf<ProvideOptions<string>>()
  })
})
