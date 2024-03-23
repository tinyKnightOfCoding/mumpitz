export type Constructor<T = unknown> = new (...args: unknown[]) => T

export function isConstructor(subject: unknown): subject is Constructor {
  return typeof subject === 'function' && subject.prototype && subject.prototype.constructor === subject
}
