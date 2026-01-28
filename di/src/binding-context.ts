import { BindingMap } from '@/binding-map'
import type { RequestResult } from '@/provide'
import { ResolutionContext } from '@/resolution-context'
import { type Awaitable, Deferred, type Defined, once } from '@/types'

type RootBindingContextOptions<T extends Defined> = {
  key: symbol
  scope: 'root'
  use: () => Awaitable<T>
  onDestroy?: (value: T) => Awaitable<void>
}

type RequestBindingContextOptions<T extends Defined> = {
  key: symbol
  scope: 'request'
  use: () => Awaitable<T>
  onDestroy?: (value: T, options: RequestResult) => Awaitable<void>
}

export type BindingContextOptions<T extends Defined> = RootBindingContextOptions<T> | RequestBindingContextOptions<T>

export class BindingContext {
  private readonly rootMap: BindingMap<[]>
  private readonly requestMap = new BindingMap<[RequestResult]>()
  private readonly _destroyed = new Deferred<void>()
  private isDestroyed = false

  constructor(rootMap: BindingMap<[]>) {
    this.rootMap = rootMap
  }

  readonly resolve = <T extends Defined>(options: BindingContextOptions<T>): Promise<T> => {
    this.assertNotDestroyed()
    const context = ResolutionContext.current() ?? ResolutionContext.empty()
    const dependentKey = context.peek()
    return context.run(options, () => {
      switch (options.scope) {
        case 'root':
          return this.rootMap.resolve(options, dependentKey)
        case 'request':
          return this.requestMap.resolve(options, dependentKey)
      }
    })
  }

  readonly isBound = (key: symbol, scope: 'root' | 'request'): boolean => {
    // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
    switch (scope) {
      case 'root':
        return this.rootMap.isBound(key)
      case 'request':
        return this.requestMap.isBound(key)
    }
  }

  readonly destroyed = (): Promise<void> => this._destroyed.promise

  readonly destroy: (options: RequestResult) => Promise<void> = once(async (options: RequestResult): Promise<void> => {
    try {
      this.isDestroyed = true
      await this.requestMap.destroy(options)
    } catch (_error) {
      // TODO figure out error handling
    } finally {
      this._destroyed.resolve()
    }
  })

  private readonly assertNotDestroyed = () => {
    if (this.isDestroyed) {
      throw new Error('This binding has been destroyed.')
    }
  }
}
