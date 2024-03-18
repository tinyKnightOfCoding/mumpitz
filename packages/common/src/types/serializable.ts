import { isDefined } from './defined'

export type Serializable<T = unknown> = {
  toJSON(): T
}

export function isSerializable(subject: unknown): subject is Serializable {
  return isDefined(subject) && typeof (subject as any).toJSON === 'function' && (subject as any).toJSON.length === 0
}

export function serialize<T = unknown>(subject: T | Serializable<T>): T {
  return isSerializable(subject) ? subject.toJSON() : subject
}