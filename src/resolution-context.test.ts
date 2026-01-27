import { afterEach, describe, expect, test, vi } from 'vitest'
import { ResolutionContext } from './resolution-context'

describe('ResolutionContext', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('returns undefined for empty context peek', () => {
    const context = ResolutionContext.empty()
    expect(context.peek()).toBeUndefined()
  })

  test('returns last element key for peek', () => {
    const context = ResolutionContext.empty()
    const key1 = Symbol('key1')
    const key2 = Symbol('key2')
    const key3 = Symbol('key3')
    context.run({ key: key1, scope: 'root' }, () => {
      const ctx1 = ResolutionContext.current()
      expect(ctx1?.peek()).toBe(key1)
      ctx1?.run({ key: key2, scope: 'root' }, () => {
        const ctx2 = ResolutionContext.current()
        expect(ctx2?.peek()).toBe(key2)
        ctx2?.run({ key: key3, scope: 'root' }, () => {
          const ctx3 = ResolutionContext.current()
          expect(ctx3?.peek()).toBe(key3)
        })
        expect(ctx2?.peek()).toBe(key2)
      })
      expect(ctx1?.peek()).toBe(key1)
    })
    expect(context.peek()).toBeUndefined()
  })

  test('runs callback with new context', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('test')
    let capturedContext: ResolutionContext | undefined
    context.run({ key, scope: 'root' }, () => {
      capturedContext = ResolutionContext.current()
      expect(capturedContext).toBeDefined()
      expect(capturedContext).not.toBe(context)
    })
    expect(ResolutionContext.current()).toBeUndefined()
  })

  test('detects circular dependencies', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('circular')
    context.run({ key, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      expect(() => {
        current?.run({ key, scope: 'root' }, () => {
          // Should not reach here
        })
      }).toThrow('circular dependency detected')
    })
  })

  test('detects circular dependencies with description', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('my-service')
    context.run({ key, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      try {
        current?.run({ key, scope: 'root' }, () => {
          // Should not reach here
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('circular dependency detected')
        expect((error as Error).message).toContain('my-service')
      }
    })
  })

  test('prevents root scope depending on request scope', () => {
    const context = ResolutionContext.empty()
    const rootKey = Symbol('root')
    const requestKey = Symbol('request')
    context.run({ key: rootKey, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      expect(() => {
        current?.run({ key: requestKey, scope: 'request' }, () => {
          // Should not reach here
        })
      }).toThrow('root scope cannot depend on request scope')
    })
  })

  test('prevents root scope depending on request scope with description', () => {
    const context = ResolutionContext.empty()
    const rootKey = Symbol('root-service')
    const requestKey = Symbol('request-service')
    context.run({ key: rootKey, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      try {
        current?.run({ key: requestKey, scope: 'request' }, () => {
          // Should not reach here
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('root scope cannot depend on request scope')
        expect((error as Error).message).toContain('request-service')
      }
    })
  })

  test('prevents request scope when root scope is in stack', () => {
    const context = ResolutionContext.empty()
    const rootKey = Symbol('root')
    const requestKey = Symbol('request')
    context.run({ key: rootKey, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      expect(() => {
        current?.run({ key: requestKey, scope: 'request' }, () => {
          // Should not reach here
        })
      }).toThrow('root scope cannot depend on request scope')
    })
  })

  test('allows request scope depending on request scope', () => {
    const context = ResolutionContext.empty()
    const requestKey1 = Symbol('request1')
    const requestKey2 = Symbol('request2')
    let executed = false
    context.run({ key: requestKey1, scope: 'request' }, () => {
      const current = ResolutionContext.current()
      current?.run({ key: requestKey2, scope: 'request' }, () => {
        executed = true
      })
    })
    expect(executed).toBe(true)
  })

  test('allows root scope depending on root scope', () => {
    const context = ResolutionContext.empty()
    const rootKey1 = Symbol('root1')
    const rootKey2 = Symbol('root2')
    let executed = false
    context.run({ key: rootKey1, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      current?.run({ key: rootKey2, scope: 'root' }, () => {
        executed = true
      })
    })
    expect(executed).toBe(true)
  })

  test('formats toString correctly', () => {
    const context = ResolutionContext.empty()
    const key1 = Symbol('service1')
    const key2 = Symbol('service2')
    const key3 = Symbol('service3')
    let chain = ''
    context.run({ key: key1, scope: 'root' }, () => {
      const ctx1 = ResolutionContext.current()
      expect(ctx1?.toString()).toBe('service1')
      ctx1?.run({ key: key2, scope: 'root' }, () => {
        const ctx2 = ResolutionContext.current()
        expect(ctx2?.toString()).toBe('service1->service2')
        ctx2?.run({ key: key3, scope: 'root' }, () => {
          const ctx3 = ResolutionContext.current()
          chain = ctx3?.toString() ?? ''
        })
      })
    })
    expect(chain).toBe('service1->service2->service3')
  })

  test('formats toString correctly with request scopes', () => {
    const context = ResolutionContext.empty()
    const requestKey1 = Symbol('request1')
    const requestKey2 = Symbol('request2')
    let chain = ''
    context.run({ key: requestKey1, scope: 'request' }, () => {
      const current = ResolutionContext.current()
      current?.run({ key: requestKey2, scope: 'request' }, () => {
        const ctx = ResolutionContext.current()
        chain = ctx?.toString() ?? ''
      })
    })
    expect(chain).toBe('request1->request2')
  })

  test('returns current context from AsyncLocalStorage', () => {
    const context = ResolutionContext.empty()
    expect(ResolutionContext.current()).toBeUndefined()
    context.run({ key: Symbol('test'), scope: 'root' }, () => {
      const current = ResolutionContext.current()
      expect(current).toBeDefined()
      expect(current).not.toBe(context)
    })
    expect(ResolutionContext.current()).toBeUndefined()
  })

  test('creates empty context', () => {
    const context = ResolutionContext.empty()
    expect(context.peek()).toBeUndefined()
    expect(ResolutionContext.current()).toBeUndefined()
  })

  test('maintains context isolation across nested runs', () => {
    const context = ResolutionContext.empty()
    const key1 = Symbol('key1')
    const key2 = Symbol('key2')
    const key3 = Symbol('key3')
    let innerContext: ResolutionContext | undefined
    let middleContext: ResolutionContext | undefined
    let outerContext: ResolutionContext | undefined
    context.run({ key: key1, scope: 'root' }, () => {
      outerContext = ResolutionContext.current()
      outerContext?.run({ key: key2, scope: 'root' }, () => {
        middleContext = ResolutionContext.current()
        middleContext?.run({ key: key3, scope: 'root' }, () => {
          innerContext = ResolutionContext.current()
        })
        expect(ResolutionContext.current()).toBe(middleContext)
      })
      expect(ResolutionContext.current()).toBe(outerContext)
    })
    expect(ResolutionContext.current()).toBeUndefined()
    expect(innerContext).toBeDefined()
    expect(middleContext).toBeDefined()
    expect(outerContext).toBeDefined()
    expect(innerContext).not.toBe(middleContext)
    expect(middleContext).not.toBe(outerContext)
  })

  test('detects circular dependency in nested context', () => {
    const context = ResolutionContext.empty()
    const key1 = Symbol('key1')
    const key2 = Symbol('key2')
    context.run({ key: key1, scope: 'root' }, () => {
      const current1 = ResolutionContext.current()
      current1?.run({ key: key2, scope: 'root' }, () => {
        const current2 = ResolutionContext.current()
        expect(() => {
          current2?.run({ key: key1, scope: 'root' }, () => {
            // Should not reach here
          })
        }).toThrow('circular dependency detected')
      })
    })
  })

  test('prevents same key even in different scopes', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('same-key')
    context.run({ key, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      // Even though scope is different, same key creates a cycle
      expect(() => {
        current?.run({ key, scope: 'request' }, () => {
          // Should not reach here
        })
      }).toThrow('circular dependency detected')
    })
  })

  test('prevents request scope after root scope in chain', () => {
    const context = ResolutionContext.empty()
    const rootKey = Symbol('root')
    const requestKey = Symbol('request')
    // Request fails because root is in stack
    context.run({ key: rootKey, scope: 'root' }, () => {
      const current = ResolutionContext.current()
      expect(() => {
        current?.run({ key: requestKey, scope: 'request' }, () => {
          // Should not reach here
        })
      }).toThrow('root scope cannot depend on request scope')
    })
  })

  test('returns callback result', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('test')
    const result = context.run({ key, scope: 'root' }, () => {
      return 'test-result'
    })
    expect(result).toBe('test-result')
  })

  test('propagates errors from callback', () => {
    const context = ResolutionContext.empty()
    const key = Symbol('test')
    const error = new Error('Callback error')
    expect(() => {
      context.run({ key, scope: 'root' }, () => {
        throw error
      })
    }).toThrow(error)
  })
})
