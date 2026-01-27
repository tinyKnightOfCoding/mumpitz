import type { RequestResult } from '@/provide'
import { type Awaitable, type Deferred, type Defined, deferred, once } from '@/types'

export type BaseBinding<T extends Defined> = {
  get: () => Promise<T>
  destroyed: () => Promise<void>
}

export type RootBinding<T extends Defined> = BaseBinding<T> & {
  addDependent: (dependent: RootBinding<Defined>) => void
  destroy: () => Promise<T>
}

export type RequestBinding<T extends Defined> = BaseBinding<T> & {
  addDependent: (dependent: RequestBinding<Defined>) => void
  destroy: (result: RequestResult) => Promise<void>
}

export class Binding<T extends Defined = Defined, TDestroyParams extends unknown[] = []> {
  private readonly value: Promise<T>
  private readonly destroyCallback: ((value: T, ...args: TDestroyParams) => Awaitable<void>) | undefined
  private readonly _destroyed: Deferred<void> = deferred()
  private isDestroyed = false
  private readonly dependents: Binding<never, never>[] = []

  constructor(value: Promise<T>, destroyCallback?: (value: T, ...args: TDestroyParams) => Awaitable<void>) {
    this.value = value
    this.destroyCallback = destroyCallback
  }

  readonly get = () => {
    this.assertNotDestroyed()
    return this.value
  }

  readonly addDependent = (dependent: Binding<never, TDestroyParams>): void => {
    this.assertNotDestroyed()
    this.dependents.push(dependent)
  }

  readonly destroyed = () => this._destroyed.promise

  readonly destroy = once(async (...args: TDestroyParams) => {
    try {
      this.isDestroyed = true
      await Promise.all(this.dependents.map((dependent) => dependent.destroyed()))
      const value = await this.get()
      await this.destroyCallback?.(value, ...args)
    } catch (error) {
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
