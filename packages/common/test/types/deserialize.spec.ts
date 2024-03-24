import { deserialize, Json } from '../../src'

class StringDeserializer {
  readonly value: string
  constructor(raw: Json) {
    this.value = typeof raw === 'string' ? raw : ''
  }
}

const numberDeserializer = (raw: Json) => (typeof raw === 'number' ? raw : 0)

describe('deserialize', () => {
  it('should deserialize from a constructor', () => {
    expect(deserialize(StringDeserializer, 'Hello, World!').value).toEqual('Hello, World!')
  })
  it('should deserialize from a function', () => {
    expect(deserialize(numberDeserializer, 7)).toEqual(7)
  })
})
