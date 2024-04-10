import { Query } from './query'
import { Params } from './params'
import { EmptyObject, HttpMethod, HttpStatusCode, Json, parse, Parser } from '../types'
import { RawRequest, Request } from './request'
import { parseResponse, ResponseParser, Responses, UnknownResponse } from './response'

export type EndpointOptions<Q extends Query, P extends Params, Req, Res extends Responses> = {
  method: HttpMethod
  path: string
  query?: Parser<Q>
  params?: Parser<P>
  requestBody?: Parser<Req>
  responses: ResponseParser<Res>
}

export function endpoint<Q extends Query, P extends Params, Req, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  params: Parser<P>
  requestBody: Parser<Req>
  responses: ResponseParser<Res>
}): Endpoint<Q, P, Req, Res>
export function endpoint<P extends Params, Req, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  requestBody: Parser<Req>
  responses: ResponseParser<Res>
}): Endpoint<EmptyObject, P, Req, Res>
export function endpoint<Q extends Query, Req, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  requestBody: Parser<Req>
  responses: ResponseParser<Res>
}): Endpoint<Q, EmptyObject, Req, Res>
export function endpoint<Q extends Query, P extends Params, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  params: Parser<P>
  responses: ResponseParser<Res>
}): Endpoint<Q, P, void, Res>
export function endpoint<Req, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  requestBody: Parser<Req>
  responses: ResponseParser<Res>
}): Endpoint<EmptyObject, EmptyObject, Req, Res>
export function endpoint<P extends Params, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  responses: ResponseParser<Res>
}): Endpoint<EmptyObject, P, void, Res>
export function endpoint<Q extends Query, Res extends Responses>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  responses: ResponseParser<Res>
}): Endpoint<Q, EmptyObject, void, Res>
export function endpoint<Res extends Responses>(options: {
  method: HttpMethod
  path: string
  responses: ResponseParser<Res>
}): Endpoint<EmptyObject, EmptyObject, void, Res>
export function endpoint(options: EndpointOptions<Query, Params, unknown, ResponseParser>): Endpoint {
  return new Endpoint(
    options.method,
    options.path,
    options.query ?? emptyParser,
    options.params ?? emptyParser,
    options.requestBody ?? voidParser,
    options.responses,
  )
}

export class Endpoint<
  Q extends Query = Query,
  P extends Params = Params,
  Req = unknown,
  Res extends Responses = Responses,
> {
  constructor(
    readonly method: HttpMethod,
    readonly path: string,
    readonly query: Parser<Q>,
    readonly params: Parser<P>,
    readonly requestBody: Parser<Req>,
    readonly responses: ResponseParser<Res>,
  ) {}

  parseRequest({ query, params, body }: RawRequest): Request<Q, P, Req> {
    return new Request<Q, P, Req>(
      parse(this.query, query),
      parse(this.params, params),
      parse(this.requestBody, body ?? {}),
    )
  }

  parseResponse(statusCode: HttpStatusCode, body: Json | undefined): Res[keyof Res] | UnknownResponse {
    return parseResponse(this.responses, statusCode, body)
  }
}

const emptyParser: Parser<EmptyObject> = () => ({})

const voidParser: Parser<void> = () => {}
