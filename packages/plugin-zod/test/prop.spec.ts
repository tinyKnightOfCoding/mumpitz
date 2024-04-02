import { prop } from '../src'
import { z, ZodType } from 'zod'

const mockZodType: ZodType<string> = z.string()

class MockZodConstructor {
  constructor(public value: string) {}

  static schema = mockZodType
}

describe('prop', () => {
  it('should transform the value using the provided constructor', () => {
    const inputValue = 'test'

    const result = prop(MockZodConstructor).parse(inputValue)

    expect(result).toEqual(new MockZodConstructor(inputValue))
  })
})
