import { afterEach, describe, expect, test, vi } from 'vitest'
import { RootContext } from './root-context'
import { deferred } from './types/deferred'

describe('RootContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('creates request context in run', async () => {
    const context = new RootContext()
    let requestContext1: unknown = null
    let requestContext2: unknown = null
    await context.run(() => {
      requestContext1 = RootContext.resolve({ key: Symbol('test'), scope: 'root', use: () => 'value' })
    })
    await context.run(() => {
      requestContext2 = RootContext.resolve({ key: Symbol('test'), scope: 'root', use: () => 'value' })
    })
    // Each run should have its own request context
    expect(requestContext1).not.toBeNull()
    expect(requestContext2).not.toBeNull()
  })

  test('runs callback with request context', async () => {
    const context = new RootContext()
    const key = Symbol('test')
    const value = { id: 1 }
    const result = await context.run(async () => {
      return await RootContext.resolve({
        key,
        scope: 'request',
        use: () => value,
      })
    })
    expect(result).toBe(value)
  })

  test('resolves bindings within run context', async () => {
    const context = new RootContext()
    const rootKey = Symbol('root')
    const requestKey = Symbol('request')
    const rootValue = 'root-value'
    const requestValue = 'request-value'
    await context.run(async () => {
      const root = await RootContext.resolve({
        key: rootKey,
        scope: 'root',
        use: () => rootValue,
      })
      const request = await RootContext.resolve({
        key: requestKey,
        scope: 'request',
        use: () => requestValue,
      })
      expect(root).toBe(rootValue)
      expect(request).toBe(requestValue)
    })
  })

  test('throws when resolving outside context', () => {
    expect(() => {
      void RootContext.resolve({ key: Symbol('test'), scope: 'root', use: () => 'value' })
    }).toThrow('Cannot resolve binding outside of context')
  })

  test('checks bound status within context', async () => {
    const context = new RootContext()
    const key = Symbol('test')
    await context.run(async () => {
      expect(RootContext.isBound(key, 'root')).toBe(false)
      await RootContext.resolve({ key, scope: 'root', use: () => 'value' })
      expect(RootContext.isBound(key, 'root')).toBe(true)
    })
  })

  test('throws when checking bound outside context', () => {
    expect(() => {
      RootContext.isBound(Symbol('test'), 'root')
    }).toThrow('Cannot resolve binding outside of context')
  })

  test('destroys request context on success', async () => {
    const context = new RootContext()
    const key = Symbol('request')
    const onDestroy = vi.fn()
    await context.run(async () => {
      await RootContext.resolve({
        key,
        scope: 'request',
        use: () => 'value',
        onDestroy,
      })
    })
    // Request context should be destroyed with success result
    expect(onDestroy).toHaveBeenCalledWith('value', { reason: 'success', result: undefined })
  })

  test('destroys request context on error', async () => {
    const context = new RootContext()
    const key = Symbol('request')
    const onDestroy = vi.fn()
    const error = new Error('Test error')
    try {
      await context.run(async () => {
        await RootContext.resolve({
          key,
          scope: 'request',
          use: () => 'value',
          onDestroy,
        })
        throw error
      })
      expect.fail('Should have thrown')
    } catch (e) {
      expect(e).toBe(error)
    }
    // Request context should be destroyed with error result
    expect(onDestroy).toHaveBeenCalledWith('value', { reason: 'error', error })
  })

  test('removes request from set after completion', async () => {
    const context = new RootContext()
    expect(context.isDestroyed).toBe(false)
    await context.run(async () => {
      await RootContext.resolve({
        key: Symbol('test'),
        scope: 'request',
        use: () => 'value',
      })
    })
    // Request should be removed from set after completion
    // We can verify this by checking that destroy waits for requests
    await context.destroy()
    expect(context.isDestroyed).toBe(true)
  })

  test('throws when running after destroy', async () => {
    const context = new RootContext()
    await context.destroy()
    await expect(
      context.run(async () => {
        return 'value'
      }),
    ).rejects.toThrow('This context has been destroyed.')
  })

  test('wraps handler in context.run using with', async () => {
    const context = new RootContext()
    const handler = context.with(async () => {
      return await RootContext.resolve({ key: Symbol('test'), scope: 'request', use: () => 'value' })
    })
    const result = await handler()
    expect(result).toBe('value')
  })

  test('passes arguments through to with handler', async () => {
    const context = new RootContext()
    const handler = context.with(async (a: string, b: number) => {
      return `${a}-${b}`
    })
    const result = await handler('hello', 42)
    expect(result).toBe('hello-42')
  })

  test('destroys request bindings after with handler completes', async () => {
    const context = new RootContext()
    const onDestroy = vi.fn()
    const handler = context.with(async () => {
      await RootContext.resolve({
        key: Symbol('request'),
        scope: 'request',
        use: () => 'value',
        onDestroy,
      })
    })
    await handler()
    expect(onDestroy).toHaveBeenCalledWith('value', { reason: 'success', result: undefined })
  })

  test('propagates errors from with handler', async () => {
    const context = new RootContext()
    const error = new Error('handler error')
    const handler = context.with(async () => {
      throw error
    })
    await expect(handler()).rejects.toBe(error)
  })

  test('throws when calling with handler after destroy', async () => {
    const context = new RootContext()
    const handler = context.with(async () => 'value')
    await context.destroy()
    await expect(handler()).rejects.toThrow('This context has been destroyed.')
  })

  test('waits for all requests before destroying root', async () => {
    const context = new RootContext()
    const rootKey = Symbol('root')
    const rootOnDestroy = vi.fn()
    let request1Completed = false
    let request2Completed = false
    const def1 = deferred<void>()
    const def2 = deferred<void>()
    // Start two concurrent requests
    const request1 = context.run(async () => {
      await def1.promise
      request1Completed = true
      return 'request1'
    })
    const request2 = context.run(async () => {
      await def2.promise
      request2Completed = true
      return 'request2'
    })
    // Resolve a root binding
    await context.run(async () => {
      await RootContext.resolve({
        key: rootKey,
        scope: 'root',
        use: () => 'root',
        onDestroy: rootOnDestroy,
      })
    })
    // Start destroy (should wait for requests)
    const destroyPromise = context.destroy()
    expect(request1Completed).toBe(false)
    expect(request2Completed).toBe(false)
    expect(rootOnDestroy).not.toHaveBeenCalled()
    // Resolve requests to complete
    def1.resolve()
    def2.resolve()
    // Wait for requests to complete
    await request1
    await request2
    // Now destroy should complete
    await destroyPromise
    expect(request1Completed).toBe(true)
    expect(request2Completed).toBe(true)
    expect(rootOnDestroy).toHaveBeenCalled()
  })

  test('destroys root map on destroy', async () => {
    const context = new RootContext()
    const key = Symbol('root')
    const onDestroy = vi.fn()
    await context.run(async () => {
      await RootContext.resolve({
        key,
        scope: 'root',
        use: () => 'value',
        onDestroy,
      })
    })
    await context.destroy()
    expect(onDestroy).toHaveBeenCalled()
  })

  test('only destroys once', async () => {
    const context = new RootContext()
    const key = Symbol('root')
    const onDestroy = vi.fn()
    await context.run(async () => {
      await RootContext.resolve({
        key,
        scope: 'root',
        use: () => 'value',
        onDestroy,
      })
    })
    const destroy1 = context.destroy()
    const destroy2 = context.destroy()
    const destroy3 = context.destroy()
    await Promise.all([destroy1, destroy2, destroy3])
    expect(onDestroy).toHaveBeenCalledOnce()
  })

  test('tracks isDestroyed state', async () => {
    const context = new RootContext()
    expect(context.isDestroyed).toBe(false)
    await context.destroy()
    expect(context.isDestroyed).toBe(true)
  })

  test('handles concurrent runs', async () => {
    const context = new RootContext()
    const results = await Promise.all([
      context.run(async () => {
        return await RootContext.resolve({
          key: Symbol('test1'),
          scope: 'request',
          use: () => 'value1',
        })
      }),
      context.run(async () => {
        return await RootContext.resolve({
          key: Symbol('test2'),
          scope: 'request',
          use: () => 'value2',
        })
      }),
      context.run(async () => {
        return await RootContext.resolve({
          key: Symbol('test3'),
          scope: 'request',
          use: () => 'value3',
        })
      }),
    ])
    expect(results).toEqual(['value1', 'value2', 'value3'])
  })

  test('shares root bindings across runs', async () => {
    const context = new RootContext()
    const key = Symbol('root')
    const factory = vi.fn(() => 'value')
    await context.run(async () => {
      await RootContext.resolve({ key, scope: 'root', use: factory })
    })
    await context.run(async () => {
      const result = await RootContext.resolve({ key, scope: 'root', use: factory })
      expect(result).toBe('value')
    })
    expect(factory).toHaveBeenCalledOnce()
  })

  test('isolates request bindings per run', async () => {
    const context = new RootContext()
    const key = Symbol('request')
    const factory1 = vi.fn(() => 'value1')
    const factory2 = vi.fn(() => 'value2')
    const result1 = await context.run(async () => {
      return await RootContext.resolve({ key, scope: 'request', use: factory1 })
    })
    const result2 = await context.run(async () => {
      return await RootContext.resolve({ key, scope: 'request', use: factory2 })
    })
    expect(result1).toBe('value1')
    expect(result2).toBe('value2')
    expect(factory1).toHaveBeenCalledOnce()
    expect(factory2).toHaveBeenCalledOnce()
  })

  test('handles promise rejection in callback', async () => {
    const context = new RootContext()
    const error = new Error('Callback error')
    await expect(
      context.run(async () => {
        throw error
      }),
    ).rejects.toBe(error)
  })

  test('handles promise rejection in request binding factory', async () => {
    const context = new RootContext()
    const error = new Error('Factory error')
    await expect(
      context.run(async () => {
        return await RootContext.resolve({
          key: Symbol('test'),
          scope: 'request',
          use: () => Promise.reject(error),
        })
      }),
    ).rejects.toBe(error)
  })
})
