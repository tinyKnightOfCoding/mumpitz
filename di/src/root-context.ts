import { AsyncLocalStorage } from 'node:async_hooks'
import { BindingContext, type BindingContextOptions } from '@/binding-context'
import { BindingMap } from '@/binding-map'
import { type Defined, isDefined, once } from '@/types'

type TypedGlobal = { __rootContextStore?: AsyncLocalStorage<BindingContext> }

function getBindingContextStore(): AsyncLocalStorage<BindingContext> {
  const typedGlobal: TypedGlobal = globalThis as TypedGlobal
  if (!isDefined(typedGlobal.__rootContextStore)) {
    typedGlobal.__rootContextStore = new AsyncLocalStorage<BindingContext>()
  }
  return typedGlobal.__rootContextStore
}

export class RootContext {
  private static readonly store: AsyncLocalStorage<BindingContext> = getBindingContextStore()

  static readonly resolve = <T extends Defined>(options: BindingContextOptions<T>): Promise<T> => {
    return RootContext.currentOrThrow().resolve(options)
  }

  static readonly isBound = (key: symbol, scope: 'root' | 'request'): boolean => {
    return RootContext.currentOrThrow().isBound(key, scope)
  }

  private static readonly currentOrThrow = (): BindingContext => {
    const current = RootContext.store.getStore()
    if (!isDefined(current)) {
      throw new Error('Cannot resolve binding outside of context')
    }
    return current
  }

  private readonly rootMap = new BindingMap()
  private readonly requests = new Set<BindingContext>()
  private _isDestroyed = false

  get isDestroyed(): boolean {
    return this._isDestroyed
  }

  readonly with = <TArgs extends unknown[], T>(
    handler: (...args: TArgs) => T,
  ): ((...args: TArgs) => Promise<Awaited<T>>) => {
    return (...args: TArgs) => this.run(() => handler(...args))
  }

  readonly run = async <T>(callback: () => T): Promise<Awaited<T>> => {
    this.assertNotDestroyed()
    const request = new BindingContext(this.rootMap)
    this.requests.add(request)
    try {
      const result = await RootContext.store.run(request, callback)
      await request.destroy({ reason: 'success', result })
      return result
    } catch (error) {
      await request.destroy({ reason: 'error', error })
      throw error
    } finally {
      this.requests.delete(request)
    }
  }

  readonly destroy: () => Promise<void> = once(async (): Promise<void> => {
    try {
      this._isDestroyed = true
      const allRequestsCompleted = [...this.requests].map((request) => request.destroyed())
      await Promise.allSettled(allRequestsCompleted)
      await this.rootMap.destroy()
    } catch (_error) {
      // TODO figure out error handling
    }
  })

  private readonly assertNotDestroyed = () => {
    if (this._isDestroyed) {
      throw new Error('This context has been destroyed.')
    }
  }
}
