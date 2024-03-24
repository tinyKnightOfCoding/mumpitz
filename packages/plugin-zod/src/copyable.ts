// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Copyable<O = unknown> {
  copy(overrides?: Partial<O>): this
}
