import { Json, parse, ParserInterface } from '../../src'
import { jest } from '@jest/globals'

const parserFunction = jest.fn((raw: Json | undefined) => raw as string)

class MockParserInterface implements ParserInterface<string> {
  parse(raw: Json | undefined): string {
    return raw as string
  }
}

class MockParseableType {
  constructor(private value: string) {}

  static readonly schema = new MockParserInterface()
}

describe('parse', () => {
  beforeEach(() => {
    parserFunction.mockClear()
  })

  it('should parse with ParserFunction', () => {
    const raw: Json = 'test'
    const result = parse(parserFunction, raw)
    expect(parserFunction).toHaveBeenCalledWith(raw)
    expect(result).toEqual(raw)
  })

  it('should parse with ParserInterface', () => {
    const raw: Json = 'test'
    const parser: ParserInterface<string> = new MockParserInterface()
    const result = parse(parser, raw)
    expect(result).toEqual(raw)
  })

  it('should parse with ParseableType', () => {
    const raw: Json = 'test'
    const result = parse(MockParseableType, raw)
    expect(result).toEqual(new MockParseableType(raw))
  })
})
