import { isDefined } from './defined'

export type Serializable<T = unknown> = {
  toJSON(): T
}

export function isSerializable(subject: unknown): subject is Serializable {
  return isDefined(subject) && typeof (subject as Serializable).toJSON === 'function'
}

export function serialize<T = unknown>(subject: T | Serializable<T>): T {
  return isSerializable(subject) ? subject.toJSON() : subject
}
