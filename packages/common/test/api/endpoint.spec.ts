import { endpoint, Json, Parser, RawParams, RawQuery } from '../../src'

describe('Endpoint', () => {
  it('should deserialize request', () => {
    const aEndpoint = endpoint({
      method: 'get',
      path: '/endpoints',
      query: mockParser({ query: 'Hello' }),
      params: mockParser({ params: 'Blubb' }),
      requestBody: mockParser({ body: 'World' }),
    })
    const query: RawQuery = { raw: 'query' }
    const params: RawParams = { raw: 'params' }
    const body: Json = { raw: 'body' }
    const result = aEndpoint.deserialize({ query, params, body })
    expect(result.query).toEqual({ query: 'Hello' })
    expect(result.params).toEqual({ params: 'Blubb' })
    expect(result.body).toEqual({ body: 'World' })
    expect(aEndpoint.query).toHaveBeenCalledWith(query)
    expect(aEndpoint.params).toHaveBeenCalledWith(params)
    expect(aEndpoint.requestBody).toHaveBeenCalledWith(body)
  })
})

function mockParser<O = unknown>(deserializedValue: O): Parser<O> {
  const mock = jest.fn()
  mock.mockReturnValue(deserializedValue)
  return mock
}
