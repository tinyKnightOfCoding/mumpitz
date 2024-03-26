import { Query, QueryDeserializer } from './query'
import { Params, ParamsDeserializer } from './params'
import { deserialize, Deserializer, EmptyObject, HttpMethod, HttpStatus } from '../types'
import { RawRequest, Request } from './request'

export type EndpointOptions<Q extends Query, P extends Params, Req, Res> = {
  method: HttpMethod
  path: string
  query?: QueryDeserializer<Q>
  params?: ParamsDeserializer<P>
  requestBody?: Deserializer<Req>
  responseBody?: Deserializer<Res>
  responseStatus?: HttpStatus
}

export function endpoint<Q extends Query, P extends Params, Req, Res>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  params: ParamsDeserializer<P>
  requestBody: Deserializer<Req>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, Req, Res>
export function endpoint<P extends Params, Req, Res>(options: {
  method: HttpMethod
  path: string
  params: ParamsDeserializer<P>
  requestBody: Deserializer<Req>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, Req, Res>
export function endpoint<Q extends Query, Req, Res>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  requestBody: Deserializer<Req>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, Req, Res>
export function endpoint<Q extends Query, P extends Params, Res>(options: {
  method: HttpMethod
  query: QueryDeserializer<Q>
  params: ParamsDeserializer<P>
  responseBody: Deserializer<Res>
  path: string
  responseStatus?: HttpStatus
}): Endpoint<Q, P, void, Res>
export function endpoint<Q extends Query, P extends Params, Req>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  params: ParamsDeserializer<P>
  requestBody: Deserializer<Req>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, Req, void>
export function endpoint<Req, Res>(options: {
  method: HttpMethod
  path: string
  requestBody: Deserializer<Req>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, Req, Res>
export function endpoint<P extends Params, Res>(options: {
  method: HttpMethod
  path: string
  params: ParamsDeserializer<P>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, void, Res>
export function endpoint<P extends Params, Req>(options: {
  method: HttpMethod
  path: string
  params: ParamsDeserializer<P>
  requestBody: Deserializer<Req>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, Req, void>
export function endpoint<Q extends Query, Res>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, void, Res>
export function endpoint<Q extends Query, Req>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  requestBody: Deserializer<Req>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, Req, void>
export function endpoint<Q extends Query, P extends Params>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  params: ParamsDeserializer<P>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, void, void>
export function endpoint<Q extends Query>(options: {
  method: HttpMethod
  path: string
  query: QueryDeserializer<Q>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, void, void>
export function endpoint<P extends Params>(options: {
  method: HttpMethod
  path: string
  params: ParamsDeserializer<P>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, void, void>
export function endpoint<Req>(options: {
  method: HttpMethod
  path: string
  requestBody: Deserializer<Req>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, Req, void>
export function endpoint<Res>(options: {
  method: HttpMethod
  path: string
  responseBody: Deserializer<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, void, Res>
export function endpoint(options: {
  method: HttpMethod
  path: string
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, void, void>
export function endpoint(
  options: EndpointOptions<Query, Params, unknown, unknown>,
): Endpoint<Query, Params, unknown, unknown> {
  return new Endpoint<Query, Params, unknown, unknown>(
    options.method,
    options.path,
    options.query ?? emptyDeserializer,
    options.params ?? emptyDeserializer,
    options.requestBody ?? voidDeserializer,
    options.responseStatus ?? 'ok',
    options.responseBody ?? voidDeserializer,
  )
}

export class Endpoint<Q extends Query, P extends Params, Req, Res> {
  constructor(
    readonly method: HttpMethod,
    readonly path: string,
    readonly query: QueryDeserializer<Q>,
    readonly params: ParamsDeserializer<P>,
    readonly requestBody: Deserializer<Req>,
    readonly responseStatus: HttpStatus,
    readonly responseBody: Deserializer<Res>,
  ) {}

  deserialize({ query, params, body }: RawRequest): Request<Q, P, Req> {
    return new Request<Q, P, Req>(
      deserialize(this.query, query),
      deserialize(this.params, params),
      deserialize(this.requestBody, body),
    )
  }
}

const emptyDeserializer: Deserializer<EmptyObject> = () => ({})

const voidDeserializer: Deserializer<void> = () => {}
