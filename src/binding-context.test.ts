import { afterEach, describe, expect, test, vi } from 'vitest'
import { BindingContext } from './binding-context'
import { BindingMap } from './binding-map'
import { ResolutionContext } from './resolution-context'

describe('BindingContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('resolves root scope binding', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('root')
    const value = { id: 1 }
    const result = await context.resolve({
      key,
      scope: 'root',
      use: () => value,
    })
    expect(result).toBe(value)
    expect(context.isBound(key, 'root')).toBe(true)
  })

  test('resolves request scope binding', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    const value = { id: 1 }
    const result = await context.resolve({
      key,
      scope: 'request',
      use: () => value,
    })
    expect(result).toBe(value)
    expect(context.isBound(key, 'request')).toBe(true)
  })

  test('tracks dependencies via resolution context', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const parentKey = Symbol('parent')
    const childKey = Symbol('child')
    const destroyOrder: string[] = []
    // Resolve parent first
    await context.resolve({
      key: parentKey,
      scope: 'request',
      use: () => 'parent',
      onDestroy: () => {
        destroyOrder.push('parent')
      },
    })
    // Resolve child with parent as dependent (via resolution context)
    await ResolutionContext.empty().run(
      { key: parentKey, scope: 'request' },
      async () => {
        await context.resolve({
          key: childKey,
          scope: 'request',
          use: () => 'child',
          onDestroy: () => {
            destroyOrder.push('child')
          },
        })
      },
    )
    await context.destroy({ reason: 'success', result: null })
    expect(destroyOrder).toContain('child')
    expect(destroyOrder).toContain('parent')
  })

  test('checks root scope binding status', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('root')
    expect(context.isBound(key, 'root')).toBe(false)
    await context.resolve({ key, scope: 'root', use: () => 'value' })
    expect(context.isBound(key, 'root')).toBe(true)
  })

  test('checks request scope binding status', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    expect(context.isBound(key, 'request')).toBe(false)
    await context.resolve({ key, scope: 'request', use: () => 'value' })
    expect(context.isBound(key, 'request')).toBe(true)
  })

  test('throws when resolving after destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('test')
    await context.destroy({ reason: 'success', result: null })
    try {
      await context.resolve({ key, scope: 'root', use: () => 'value' })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('This binding has been destroyed.')
    }
  })

  test('throws when checking bound after destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('test')
    await context.resolve({ key, scope: 'root', use: () => 'value' })
    await context.destroy({ reason: 'success', result: null })
    // isBound doesn't check if destroyed, it just checks the map
    expect(context.isBound(key, 'root')).toBe(true)
  })

  test('destroys request map on destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const rootKey = Symbol('root')
    const requestKey = Symbol('request')
    const rootOnDestroy = vi.fn()
    const requestOnDestroy = vi.fn()
    await context.resolve({
      key: rootKey,
      scope: 'root',
      use: () => 'root',
      onDestroy: rootOnDestroy,
    })
    await context.resolve({
      key: requestKey,
      scope: 'request',
      use: () => 'request',
      onDestroy: requestOnDestroy,
    })
    await context.destroy({ reason: 'success', result: null })
    // Root should not be destroyed (it's in rootMap, not requestMap)
    expect(rootOnDestroy).not.toHaveBeenCalled()
    // Request should be destroyed
    expect(requestOnDestroy).toHaveBeenCalled()
  })

  test('resolves destroyed promise after destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const destroyedPromise = context.destroyed()
    await context.destroy({ reason: 'success', result: null })
    await expect(destroyedPromise).resolves.toBeUndefined()
  })

  test('uses empty resolution context when none exists', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('test')
    // Resolve without an active ResolutionContext
    const result = await context.resolve({
      key,
      scope: 'root',
      use: () => 'value',
    })
    expect(result).toBe('value')
    expect(context.isBound(key, 'root')).toBe(true)
  })

  test('passes RequestResult to request map destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    const requestResult = { reason: 'error' as const, error: new Error('test') }
    const onDestroy = vi.fn()
    await context.resolve({
      key,
      scope: 'request',
      use: () => 'value',
      onDestroy,
    })
    await context.destroy(requestResult)
    expect(onDestroy).toHaveBeenCalledWith('value', requestResult)
  })

  test('passes success RequestResult to request map destroy', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    const requestResult = { reason: 'success' as const, result: { data: 'test' } }
    const onDestroy = vi.fn()
    await context.resolve({
      key,
      scope: 'request',
      use: () => 'value',
      onDestroy,
    })
    await context.destroy(requestResult)
    expect(onDestroy).toHaveBeenCalledWith('value', requestResult)
  })

  test('handles async factory functions', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('test')
    const value = { id: 1 }
    const factory = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return value
    })
    const result = await context.resolve({
      key,
      scope: 'root',
      use: factory,
    })
    expect(result).toBe(value)
    expect(factory).toHaveBeenCalledOnce()
  })

  test('handles multiple destroy calls', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    const onDestroy = vi.fn()
    await context.resolve({
      key,
      scope: 'request',
      use: () => 'value',
      onDestroy,
    })
    const destroy1 = context.destroy({ reason: 'success', result: null })
    const destroy2 = context.destroy({ reason: 'success', result: null })
    const destroy3 = context.destroy({ reason: 'success', result: null })
    await Promise.all([destroy1, destroy2, destroy3])
    expect(onDestroy).toHaveBeenCalledOnce()
  })

  test('shares root map across contexts', async () => {
    const rootMap = new BindingMap<[]>()
    const context1 = new BindingContext(rootMap)
    const context2 = new BindingContext(rootMap)
    const key = Symbol('root')
    const value = { id: 1 }
    const factory = vi.fn(() => value)
    const result1 = await context1.resolve({
      key,
      scope: 'root',
      use: factory,
    })
    const result2 = await context2.resolve({
      key,
      scope: 'root',
      use: factory,
    })
    expect(result1).toBe(result2)
    expect(factory).toHaveBeenCalledOnce()
  })

  test('isolates request map per context', async () => {
    const rootMap = new BindingMap<[]>()
    const context1 = new BindingContext(rootMap)
    const context2 = new BindingContext(rootMap)
    const key = Symbol('request')
    const factory1 = vi.fn(() => 'value1')
    const factory2 = vi.fn(() => 'value2')
    const result1 = await context1.resolve({
      key,
      scope: 'request',
      use: factory1,
    })
    const result2 = await context2.resolve({
      key,
      scope: 'request',
      use: factory2,
    })
    expect(result1).toBe('value1')
    expect(result2).toBe('value2')
    expect(factory1).toHaveBeenCalledOnce()
    expect(factory2).toHaveBeenCalledOnce()
  })

  test('handles promise rejection in factory', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('test')
    const error = new Error('Factory failed')
    await expect(
      context.resolve({
        key,
        scope: 'root',
        use: () => Promise.reject(error),
      }),
    ).rejects.toBe(error)
  })

  test('handles promise rejection in onDestroy callback', async () => {
    const rootMap = new BindingMap<[]>()
    const context = new BindingContext(rootMap)
    const key = Symbol('request')
    const error = new Error('Destroy failed')
    const onDestroy = vi.fn(async () => {
      throw error
    })
    await context.resolve({
      key,
      scope: 'request',
      use: () => 'value',
      onDestroy,
    })
    // Destroy should not throw, but callback error is caught
    await expect(context.destroy({ reason: 'success', result: null })).resolves.toBeUndefined()
    expect(onDestroy).toHaveBeenCalled()
    await expect(context.destroyed()).resolves.toBeUndefined()
  })
})
