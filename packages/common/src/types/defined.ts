export type Defined = NonNullable<unknown>

export function isDefined(subject: unknown): subject is Defined {
  return subject !== null && subject !== undefined
}
