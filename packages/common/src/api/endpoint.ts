import { Query } from './query'
import { Params } from './params'
import { EmptyObject, HttpMethod, HttpStatus, parse, Parser } from '../types'
import { RawRequest, Request } from './request'

export type EndpointOptions<Q extends Query, P extends Params, Req, Res> = {
  method: HttpMethod
  path: string
  query?: Parser<Q>
  params?: Parser<P>
  requestBody?: Parser<Req>
  responseBody?: Parser<Res>
  responseStatus?: HttpStatus
}

export function endpoint<Q extends Query, P extends Params, Req, Res>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  params: Parser<P>
  requestBody: Parser<Req>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, Req, Res>
export function endpoint<P extends Params, Req, Res>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  requestBody: Parser<Req>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, Req, Res>
export function endpoint<Q extends Query, Req, Res>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  requestBody: Parser<Req>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, Req, Res>
export function endpoint<Q extends Query, P extends Params, Res>(options: {
  method: HttpMethod
  query: Parser<Q>
  params: Parser<P>
  responseBody: Parser<Res>
  path: string
  responseStatus?: HttpStatus
}): Endpoint<Q, P, void, Res>
export function endpoint<Q extends Query, P extends Params, Req>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  params: Parser<P>
  requestBody: Parser<Req>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, Req, void>
export function endpoint<Req, Res>(options: {
  method: HttpMethod
  path: string
  requestBody: Parser<Req>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, Req, Res>
export function endpoint<P extends Params, Res>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, void, Res>
export function endpoint<P extends Params, Req>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  requestBody: Parser<Req>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, Req, void>
export function endpoint<Q extends Query, Res>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  responseBody: Parser<Res>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, void, Res>
export function endpoint<Q extends Query, Req>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  requestBody: Parser<Req>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, Req, void>
export function endpoint<Q extends Query, P extends Params>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  params: Parser<P>
  responseStatus?: HttpStatus
}): Endpoint<Q, P, void, void>
export function endpoint<Q extends Query>(options: {
  method: HttpMethod
  path: string
  query: Parser<Q>
  responseStatus?: HttpStatus
}): Endpoint<Q, EmptyObject, void, void>
export function endpoint<P extends Params>(options: {
  method: HttpMethod
  path: string
  params: Parser<P>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, P, void, void>
export function endpoint<Req>(options: {
  method: HttpMethod
  path: string
  requestBody: Parser<Req>
  responseStatus?: HttpStatus
}): Endpoint<EmptyObject, EmptyObject, Req, void>
export function endpoint<Res>(options: {
  method: HttpMethod
  path: string
  responseBody: Parser<Res>
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
    options.query ?? emptyParser,
    options.params ?? emptyParser,
    options.requestBody ?? voidParser,
    options.responseStatus ?? 'ok',
    options.responseBody ?? voidParser,
  )
}

export class Endpoint<Q extends Query, P extends Params, Req, Res> {
  constructor(
    readonly method: HttpMethod,
    readonly path: string,
    readonly query: Parser<Q>,
    readonly params: Parser<P>,
    readonly requestBody: Parser<Req>,
    readonly responseStatus: HttpStatus,
    readonly responseBody: Parser<Res>,
  ) {}

  parse({ query, params, body }: RawRequest): Request<Q, P, Req> {
    return new Request<Q, P, Req>(
      parse(this.query, query),
      parse(this.params, params),
      parse(this.requestBody, body ?? {}),
    )
  }
}

const emptyParser: Parser<EmptyObject> = () => ({})

const voidParser: Parser<void> = () => {}
