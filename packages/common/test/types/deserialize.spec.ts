import { deserialize, Json } from '../../src'

class StringDeserializer {
  readonly value: string
  constructor(raw: Json) {
    this.value = typeof raw === 'string' ? raw : ''
  }
}

const numberDeserializer = (raw: Json) => (typeof raw === 'number' ? raw : 0)

class ObjectDeserializer {
  constructor(raw: Json) {
    raw
  }

  static deserialize(raw: Json) {
    raw
    return 'Hello, World!'
  }
}

describe('deserialize', () => {
  it('should deserialize from a constructor', () => {
    expect(deserialize(StringDeserializer, 'Hello, World!').value).toEqual('Hello, World!')
  })

  it('should deserialize from a function', () => {
    expect(deserialize(numberDeserializer, 7)).toEqual(7)
  })

  it('should prefer deserialize property over constructor', () => {
    expect(deserialize(ObjectDeserializer, {})).toEqual('Hello, World!')
  })
})
