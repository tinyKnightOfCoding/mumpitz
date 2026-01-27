import { Binding } from '@/binding'
import { type Awaitable, type Defined, isDefined, once } from '@/types'

type BindingMapOptions<T extends Defined, TDestroyParams extends unknown[] = []> = {
  key: symbol
  use: () => Awaitable<T>
  onDestroy?: (value: T, ...args: TDestroyParams) => Awaitable<void>
}

export class BindingMap<TDestroyParams extends unknown[]> {
  private readonly bindings = new Map<symbol, Binding<never, TDestroyParams>>()
  private isDestroyed = false

  readonly resolve = async <T extends Defined>(
    options: BindingMapOptions<T, TDestroyParams>,
    dependentKey?: symbol,
  ): Promise<T> => {
    this.assertNotDestroyed()
    const binding = this.getOrCreate(options)
    const dependentBinding = isDefined(dependentKey) ? this.bindings.get(dependentKey) : undefined
    if (isDefined(dependentBinding)) {
      binding.addDependent(dependentBinding)
    }
    return binding.get()
  }

  readonly isBound = (key: symbol): boolean => {
    return this.bindings.has(key)
  }

  readonly destroy = once(async (...args: TDestroyParams) => {
    this.isDestroyed = true
    const promise = [...this.bindings.values()].map((binding) => binding.destroy(...args))
    const results = await Promise.allSettled(promise)
    if (results.some((result) => result.status === 'rejected')) {
      // TODO figure out error handling
    }
  })

  private readonly getOrCreate = <T extends Defined>(
    options: BindingMapOptions<T, TDestroyParams>,
  ): Binding<T, TDestroyParams> => {
    const existingBinding = this.bindings.get(options.key)
    if (isDefined(existingBinding)) {
      return existingBinding as unknown as Binding<T, TDestroyParams>
    }
    const asyncUse = async () => await options.use()
    const newBinding = new Binding<T, TDestroyParams>(asyncUse(), options.onDestroy)
    this.bindings.set(options.key, newBinding as Binding<never, TDestroyParams>)
    return newBinding
  }

  private readonly assertNotDestroyed = () => {
    if (this.isDestroyed) {
      throw new Error('This binding has been destroyed.')
    }
  }
}
