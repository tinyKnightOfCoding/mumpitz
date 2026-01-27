export type Defined<T = unknown> = NonNullable<T>

export function isDefined<T extends Defined>(subject: T | null | undefined): subject is T {
  return subject !== null && subject !== undefined
}
