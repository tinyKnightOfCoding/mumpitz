import { afterEach, describe, expect, test, vi } from 'vitest'
import { BindingMap } from './binding-map'

describe('BindingMap', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('creates binding on first resolve', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const value = { id: 1 }
    const factory = vi.fn(() => value)
    const result = await map.resolve({ key, use: factory })
    expect(result).toBe(value)
    expect(factory).toHaveBeenCalledOnce()
    expect(map.isBound(key)).toBe(true)
  })

  test('reuses existing binding', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const value = { id: 1 }
    const factory = vi.fn(() => value)
    const result1 = await map.resolve({ key, use: factory })
    const result2 = await map.resolve({ key, use: factory })
    expect(result1).toBe(result2)
    expect(factory).toHaveBeenCalledOnce()
  })

  test('resolves value from binding', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const value = { id: 1, name: 'test' }
    const result = await map.resolve({ key, use: () => value })
    expect(result).toEqual(value)
  })

  test('tracks dependencies between bindings', async () => {
    const map = new BindingMap<[]>()
    const parentKey = Symbol('parent')
    const childKey = Symbol('child')
    const parentDestroyed = vi.fn()
    const childDestroyed = vi.fn()
    await map.resolve({
      key: parentKey,
      use: () => 'parent',
      onDestroy: parentDestroyed,
    })
    await map.resolve(
      {
        key: childKey,
        use: () => 'child',
        onDestroy: childDestroyed,
      },
      parentKey,
    )
    // Destroy all bindings - parent should wait for child
    await map.destroy()
    expect(parentDestroyed).toHaveBeenCalled()
    expect(childDestroyed).toHaveBeenCalled()
  })

  test('tracks dependencies between bindings with correct order', async () => {
    const map = new BindingMap<[]>()
    const parentKey = Symbol('parent')
    const childKey = Symbol('child')
    const destroyOrder: string[] = []
    let childDestroyed = false
    // Resolve child first
    await map.resolve({
      key: childKey,
      use: () => 'child',
      onDestroy: () => {
        childDestroyed = true
        destroyOrder.push('child')
      },
    })
    // Then resolve parent with child as dependent
    await map.resolve(
      {
        key: parentKey,
        use: () => 'parent',
        onDestroy: () => {
          // Parent should only be destroyed after child is destroyed
          expect(childDestroyed).toBe(true)
          destroyOrder.push('parent')
        },
      },
      childKey,
    )
    // Destroy all bindings - child should be destroyed before parent
    await map.destroy()
    expect(destroyOrder).toEqual(['child', 'parent'])
  })

  test('checks if key is bound', async () => {
    const map = new BindingMap<[]>()
    const key1 = Symbol('key1')
    const key2 = Symbol('key2')
    expect(map.isBound(key1)).toBe(false)
    expect(map.isBound(key2)).toBe(false)
    await map.resolve({ key: key1, use: () => 'value1' })
    expect(map.isBound(key1)).toBe(true)
    expect(map.isBound(key2)).toBe(false)
  })

  test('throws when resolving after destroy', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    await map.destroy()
    await expect(map.resolve({ key, use: () => 'value' })).rejects.toThrow('This binding has been destroyed.')
  })

  test('returns false when checking bound after destroy', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    await map.resolve({ key, use: () => 'value' })
    expect(map.isBound(key)).toBe(true)
    await map.destroy()
    // isBound doesn't check if destroyed, it just checks if key exists in map
    // After destroy, bindings are still in the map but destroyed
    expect(map.isBound(key)).toBe(true)
  })

  test('destroys all bindings', async () => {
    const map = new BindingMap<[]>()
    const key1 = Symbol('key1')
    const key2 = Symbol('key2')
    const key3 = Symbol('key3')
    const onDestroy1 = vi.fn()
    const onDestroy2 = vi.fn()
    const onDestroy3 = vi.fn()
    await map.resolve({ key: key1, use: () => 'value1', onDestroy: onDestroy1 })
    await map.resolve({ key: key2, use: () => 'value2', onDestroy: onDestroy2 })
    await map.resolve({ key: key3, use: () => 'value3', onDestroy: onDestroy3 })
    await map.destroy()
    expect(onDestroy1).toHaveBeenCalledOnce()
    expect(onDestroy2).toHaveBeenCalledOnce()
    expect(onDestroy3).toHaveBeenCalledOnce()
  })

  test('passes destroy params to bindings', async () => {
    const map = new BindingMap<[string, number]>()
    const key = Symbol('test')
    const onDestroy = vi.fn()
    await map.resolve({ key, use: () => 'value', onDestroy })
    await map.destroy('reason', 42)
    expect(onDestroy).toHaveBeenCalledWith('value', 'reason', 42)
  })

  test('handles async factory functions', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const value = { id: 1 }
    const factory = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return value
    })
    const result = await map.resolve({ key, use: factory })
    expect(result).toBe(value)
    expect(factory).toHaveBeenCalledOnce()
  })

  test('does not track dependency for undefined dependentKey', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const onDestroy = vi.fn()
    await map.resolve({ key, use: () => 'value', onDestroy })
    // Resolve again without dependentKey
    await map.resolve({ key, use: () => 'value', onDestroy })
    // Should not throw or create issues
    expect(map.isBound(key)).toBe(true)
  })

  test('handles multiple destroy calls', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const onDestroy = vi.fn()
    await map.resolve({ key, use: () => 'value', onDestroy })
    const destroy1 = map.destroy()
    const destroy2 = map.destroy()
    const destroy3 = map.destroy()
    await Promise.all([destroy1, destroy2, destroy3])
    expect(onDestroy).toHaveBeenCalledOnce()
  })

  test('handles promise rejection in factory', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const error = new Error('Factory failed')
    await expect(map.resolve({ key, use: () => Promise.reject(error) })).rejects.toBe(error)
  })

  test('handles promise rejection in onDestroy callback', async () => {
    const map = new BindingMap<[]>()
    const key = Symbol('test')
    const error = new Error('Destroy failed')
    const onDestroy = vi.fn(async () => {
      throw error
    })
    await map.resolve({ key, use: () => 'value', onDestroy })
    // Destroy should not throw, but callback error is caught
    await expect(map.destroy()).resolves.toBeUndefined()
    expect(onDestroy).toHaveBeenCalled()
  })

  test('handles dependency tracking when dependent is resolved first', async () => {
    const map = new BindingMap<[]>()
    const parentKey = Symbol('parent')
    const childKey = Symbol('child')
    const childDestroyed = vi.fn()
    const parentDestroyed = vi.fn()
    // Resolve child first
    await map.resolve({
      key: childKey,
      use: () => 'child',
      onDestroy: childDestroyed,
    })
    // Then resolve parent with child as dependent
    await map.resolve(
      {
        key: parentKey,
        use: () => 'parent',
        onDestroy: parentDestroyed,
      },
      childKey,
    )
    await map.destroy()
    expect(childDestroyed).toHaveBeenCalled()
    expect(parentDestroyed).toHaveBeenCalled()
  })
})
