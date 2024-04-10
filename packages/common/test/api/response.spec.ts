import { InferResponse, parseResponse, ResponseParser, UnknownResponse } from '../../src'
import { expectType, TypeEqual } from 'ts-expect'

describe('Response', () => {
  const responseParser = {
    ok: () => 'ok',
    created: () => 201,
    noContent: () => {
      throw new Error('No content')
    },
  } satisfies ResponseParser

  it('should return union of parsers', () => {
    type ParsedResponse = InferResponse<typeof responseParser>
    expectType<TypeEqual<ParsedResponse, string | number>>(true)
  })

  it('should return unknown response', () => {
    const response = parseResponse(responseParser, 404, undefined)
    expect(response).toBeInstanceOf(UnknownResponse)
  })

  it('should return parsed response', () => {
    const response = parseResponse(responseParser, 200, undefined)
    expect(response).toEqual('ok')
  })

  it('should return unknown parser given parser throws', () => {
    const response = parseResponse(responseParser, 204, undefined)
    expect(response).toBeInstanceOf(UnknownResponse)
  })
})
