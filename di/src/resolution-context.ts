import { AsyncLocalStorage } from 'node:async_hooks'

type ResolutionElement = {
  key: symbol
  scope: 'root' | 'request'
}

export class ResolutionContext {
  private static readonly store = new AsyncLocalStorage<ResolutionContext>()

  static current = () => ResolutionContext.store.getStore()

  static empty = () => new ResolutionContext()

  private readonly elements: ResolutionElement[]

  private constructor(elements: ResolutionElement[] = []) {
    this.elements = elements
  }

  readonly peek = () => this.elements[this.elements.length - 1]?.key

  readonly run = <TResult>(element: ResolutionElement, callback: () => TResult): TResult => {
    this.assertNoDependencyCycle(element)
    this.assertNoInvalidScope(element)
    const nextContext = new ResolutionContext([...this.elements, element])
    return ResolutionContext.store.run(nextContext, callback)
  }

  readonly toString = () => this.elements.map((el) => el.key.description).join('->')

  private readonly assertNoInvalidScope = (dependency: ResolutionElement) => {
    // request can depend on root or request, but root cannot depend on request
    // this means we cannot push request, if stack already contains root
    if (dependency.scope === 'request' && this.elements.some((el) => el.scope === 'root')) {
      throw new Error(`root scope cannot depend on request scope: ${this}->${dependency.key.description}`)
    }
  }

  private readonly assertNoDependencyCycle = (dependency: ResolutionElement) => {
    // A cycle means, that we have the new dependency already in the resolution stack
    if (this.elements.some((el) => el.key === dependency.key)) {
      throw new Error(`circular dependency detected: ${this}->${dependency.key.description}`)
    }
  }
}
