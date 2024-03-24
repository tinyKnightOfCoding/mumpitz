export function toReadonlyPropertyDescriptorMap(properties: Record<string, unknown>): PropertyDescriptorMap {
  return mapObjectValues(properties, toReadonlyPropertyDescriptor)
}

function toReadonlyPropertyDescriptor(value: unknown): PropertyDescriptor {
  return {
    get(): unknown {
      return value
    },
    configurable: false,
    enumerable: true,
  }
}

function mapObjectValues<T, R>(subject: Record<string, T>, transform: (value: T) => R): Record<string, R> {
  return Object.fromEntries(Object.entries(subject).map(([key, value]) => [key, transform(value)]))
}
