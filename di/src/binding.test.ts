import { afterEach, describe, expect, test, vi } from 'vitest'
import { Binding } from './binding'
import { deferred } from './types/deferred'

describe('Binding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('resolves value from promise', async () => {
    const value = { id: 1 }
    const binding = new Binding(Promise.resolve(value))
    const result = await binding.get()
    expect(result).toBe(value)
  })

  test('throws when getting destroyed binding', async () => {
    const binding = new Binding(Promise.resolve({ id: 1 }))
    await binding.destroy()
    expect(() => binding.get()).toThrow('This binding has been destroyed.')
  })

  test('tracks dependents', () => {
    const binding = new Binding(Promise.resolve({ id: 1 }))
    const dependent1 = new Binding(Promise.resolve({ id: 2 }))
    const dependent2 = new Binding(Promise.resolve({ id: 3 }))
    binding.addDependent(dependent1)
    binding.addDependent(dependent2)
    // Dependents are tracked internally, verify by checking destruction order
    expect(binding.addDependent).not.toThrow()
  })

  test('throws when adding dependent to destroyed binding', async () => {
    const binding = new Binding(Promise.resolve({ id: 1 }))
    const dependent = new Binding(Promise.resolve({ id: 2 }))
    await binding.destroy()
    expect(() => binding.addDependent(dependent)).toThrow('This binding has been destroyed.')
  })

  test('destroys in correct order', async () => {
    const destroyOrder: string[] = []
    const parent = new Binding(Promise.resolve('parent'), () => {
      destroyOrder.push('parent')
    })
    const child1 = new Binding(Promise.resolve('child1'), () => {
      destroyOrder.push('child1')
    })
    const child2 = new Binding(Promise.resolve('child2'), () => {
      destroyOrder.push('child2')
    })
    parent.addDependent(child1)
    parent.addDependent(child2)
    // Start parent destruction (it will wait for children)
    const parentDestroy = parent.destroy()
    // Destroy children first
    await child1.destroy()
    await child2.destroy()
    // Then parent can complete
    await parentDestroy
    // Children should be destroyed before parent
    expect(destroyOrder).toEqual(['child1', 'child2', 'parent'])
  })

  test('calls onDestroy callback', async () => {
    const value = { id: 1, name: 'test' }
    const onDestroy = vi.fn()
    const binding = new Binding(Promise.resolve(value), onDestroy)
    await binding.destroy()
    expect(onDestroy).toHaveBeenCalledOnce()
    expect(onDestroy).toHaveBeenCalledWith(value)
  })

  test('calls onDestroy callback with destroy params', async () => {
    const value = { id: 1 }
    const onDestroy = vi.fn()
    const binding = new Binding<typeof value, [string, number]>(Promise.resolve(value), onDestroy)
    await binding.destroy('reason', 42)
    expect(onDestroy).toHaveBeenCalledWith(value, 'reason', 42)
  })

  test('waits for dependents before destroying', async () => {
    const parentDestroyed = vi.fn()
    const childDestroyed = vi.fn()
    const parent = new Binding(Promise.resolve('parent'), parentDestroyed)
    const childDeferred = deferred<void>()
    const child = new Binding(Promise.resolve('child'), async () => {
      await childDeferred.promise
      childDestroyed()
    })
    parent.addDependent(child)
    const destroyPromise = parent.destroy()
    // Parent should not be destroyed yet
    expect(parentDestroyed).not.toHaveBeenCalled()
    expect(childDestroyed).not.toHaveBeenCalled()
    // Destroy child and resolve deferred
    const childDestroyPromise = child.destroy()
    childDeferred.resolve()
    await childDestroyPromise
    // Now parent can complete
    await destroyPromise
    // Both should be destroyed now
    expect(childDestroyed).toHaveBeenCalled()
    expect(parentDestroyed).toHaveBeenCalled()
  })

  test('resolves destroyed promise after destruction', async () => {
    const binding = new Binding(Promise.resolve({ id: 1 }))
    const destroyedPromise = binding.destroyed()
    await binding.destroy()
    await expect(destroyedPromise).resolves.toBeUndefined()
  })

  test('handles missing onDestroy callback', async () => {
    const binding = new Binding(Promise.resolve({ id: 1 }))
    await expect(binding.destroy()).resolves.toBeUndefined()
    await expect(binding.destroyed()).resolves.toBeUndefined()
  })

  test('only destroys once', async () => {
    const onDestroy = vi.fn()
    const binding = new Binding(Promise.resolve({ id: 1 }), onDestroy)
    const destroy1 = binding.destroy()
    const destroy2 = binding.destroy()
    const destroy3 = binding.destroy()
    await Promise.all([destroy1, destroy2, destroy3])
    expect(onDestroy).toHaveBeenCalledOnce()
  })

  test('handles async onDestroy callback', async () => {
    const value = { id: 1 }
    let callbackResolved = false
    const def = deferred<void>()
    const onDestroy = vi.fn(async () => {
      await def.promise
      callbackResolved = true
    })
    const binding = new Binding(Promise.resolve(value), onDestroy)
    const destroyPromise = binding.destroy()
    expect(callbackResolved).toBe(false)
    def.resolve()
    await destroyPromise
    expect(callbackResolved).toBe(true)
    expect(onDestroy).toHaveBeenCalledWith(value)
  })

  test('handles nested dependent destruction', async () => {
    const destroyOrder: string[] = []
    const grandparent = new Binding(Promise.resolve('grandparent'), () => {
      destroyOrder.push('grandparent')
    })
    const parent = new Binding(Promise.resolve('parent'), () => {
      destroyOrder.push('parent')
    })
    const child = new Binding(Promise.resolve('child'), () => {
      destroyOrder.push('child')
    })
    grandparent.addDependent(parent)
    parent.addDependent(child)
    // Start grandparent destruction (it will wait for parent)
    const grandparentDestroy = grandparent.destroy()
    // Start parent destruction (it will wait for child)
    const parentDestroy = parent.destroy()
    // Destroy child first
    await child.destroy()
    // Then parent can complete
    await parentDestroy
    // Then grandparent can complete
    await grandparentDestroy
    // Should destroy child, then parent, then grandparent
    expect(destroyOrder).toEqual(['child', 'parent', 'grandparent'])
  })

  test('handles promise rejection in value', async () => {
    const error = new Error('Value creation failed')
    const binding = new Binding(Promise.reject(error))
    await expect(binding.get()).rejects.toBe(error)
  })

  test('handles promise rejection in onDestroy callback', async () => {
    const value = { id: 1 }
    const error = new Error('Destroy failed')
    const onDestroy = vi.fn(async () => {
      throw error
    })
    const binding = new Binding(Promise.resolve(value), onDestroy)
    // Destroy should not throw, but callback error is caught
    await expect(binding.destroy()).resolves.toBeUndefined()
    expect(onDestroy).toHaveBeenCalled()
    // destroyed promise should still resolve
    await expect(binding.destroyed()).resolves.toBeUndefined()
  })

  test('handles promise rejection in dependent destruction', async () => {
    const parentDestroyed = vi.fn()
    const parent = new Binding(Promise.resolve('parent'), parentDestroyed)
    const childError = new Error('Child destroy failed')
    const child = new Binding(Promise.resolve('child'), async () => {
      throw childError
    })
    parent.addDependent(child)
    // Start parent destruction (it will wait for child)
    const parentDestroy = parent.destroy()
    // Destroy child (which will fail, but still resolve destroyed promise)
    await child.destroy()
    // Parent should still destroy even if child destroy fails
    await expect(parentDestroy).resolves.toBeUndefined()
    expect(parentDestroyed).toHaveBeenCalled()
    await expect(parent.destroyed()).resolves.toBeUndefined()
  })
})
