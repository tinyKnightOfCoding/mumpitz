import { RootContext as RootContextInternal } from './root-context'

type RootContext = {
  isDestroyed: boolean
  destroy: () => Promise<void>
  run: <T>(callback: () => T) => Promise<T>
}

function createContext(): RootContext {
  return new RootContextInternal()
}

export * from './provide'
export { createContext, type RootContext }
