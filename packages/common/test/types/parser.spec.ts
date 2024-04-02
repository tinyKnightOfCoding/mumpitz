import { Json, parse, ParserInterface } from '../../src'

const parserFunction: jest.Mock<string, [Json]> = jest.fn((raw: Json) => raw as string)

class MockParserInterface implements ParserInterface<string> {
  parse(raw: Json): string {
    return raw as string
  }
}

class MockParseableType {
  constructor(private value: string) {}

  static parse(raw: Json): string {
    return raw as string
  }
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