import type { BindingContextOptions } from '@/binding-context'
import { RootContext } from '@/root-context'
import type { Awaitable, Defined } from '@/types'

export type Ref<T extends Defined> = {
  (): Promise<T>
  bindTo: (value: T) => void
  isBound: () => boolean
}

export type BaseProvideOptions<T extends Defined> = {
  name: string
  use?: () => Awaitable<T>
  call?: never // excludes Function from this type
}

export type RootProvideOptions<T extends Defined> = BaseProvideOptions<T> & {
  scope?: 'root'
  onDestroy?: (value: T) => Awaitable<void>
}

export type RequestResult = { reason: 'error'; error: unknown } | { reason: 'success'; result: unknown }

export type RequestProvideOptions<T extends Defined> = BaseProvideOptions<T> & {
  scope: 'request'
  onDestroy?: (value: T, result: RequestResult) => Awaitable<void>
}

export type ProvideOptions<T extends Defined> = RequestProvideOptions<T> | RootProvideOptions<T>

export function provide<T extends Defined>(options: ProvideOptions<T>): Ref<T> {
  const contextOptions: BindingContextOptions<T> = {
    key: Symbol.for(options.name),
    use: options.use ?? neverFactory(options.name),
    scope: options.scope ?? 'root',
    onDestroy: options.onDestroy,
  } as BindingContextOptions<T>
  const resolve = () => RootContext.resolve(contextOptions)
  const bindTo = (value: T) => RootContext.resolve({ ...contextOptions, use: () => value })
  const isBound = () => RootContext.isBound(contextOptions.key, contextOptions.scope)
  resolve.bindTo = bindTo
  resolve.isBound = isBound
  return resolve
}

function neverFactory(name: string): () => never {
  return () => {
    throw new Error(`Ref ${name} has no factory`)
  }
}
