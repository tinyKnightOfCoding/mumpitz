import { Deserializer, endpoint, Json, RawParams, RawQuery } from '../../src'

describe('Endpoint', () => {
  it('should deserialize request', () => {
    const aEndpoint = endpoint({
      method: 'GET',
      path: '/endpoints',
      query: mockDeserializer({ query: 'Hello' }),
      params: mockDeserializer({ params: 'Blubb' }),
      requestBody: mockDeserializer({ body: 'World' }),
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

function mockDeserializer<O = unknown, I extends Json = Json>(deserializedValue: O): Deserializer<O, I> {
  const mock = jest.fn()
  mock.mockReturnValue(deserializedValue)
  return mock
}
