export type DeferredState = 'pending' | 'resolved' | 'rejected'

export class Deferred<T> {
  readonly promise: Promise<T>
  private _state: DeferredState = 'pending'
  private _value: T | undefined
  private _error: unknown | undefined
  private capturedResolve!: (value: T) => void
  private capturedReject!: (reason?: unknown) => void

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.capturedResolve = resolve
      this.capturedReject = reject
    })
  }

  get value() {
    return this._value
  }

  get error() {
    return this._error
  }

  get isCompleted() {
    return this._state !== 'pending'
  }

  get state(): DeferredState {
    return this._state
  }

  readonly resolve = (value: T) => {
    if (this._state !== 'pending') return
    this._state = 'resolved'
    this._value = value
    this.capturedResolve(value)
  }
  readonly reject = (reason?: unknown) => {
    if (this._state !== 'pending') return
    this._state = 'rejected'
    this._error = reason
    this.capturedReject(reason)
  }
}

export function deferred<T>(): Deferred<T> {
  return new Deferred<T>()
}
