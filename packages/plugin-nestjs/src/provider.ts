import {
  Endpoint,
  HttpStatus,
  HttpStatusCode,
  httpStatusCodes,
  Params,
  Query,
  Request,
  Responses,
} from '@mumpitz/common'

export type Endpoints = Record<string, Endpoint>

export class ProviderResponse<H extends HttpStatus, R> {
  constructor(
    readonly httpStatus: H,
    readonly body: R,
  ) {}

  get statusCode(): HttpStatusCode {
    return httpStatusCodes[this.httpStatus]
  }
}

export type ProviderResponses<R extends Responses> = NonNullable<
  {
    [K in keyof R]?: K extends HttpStatus ? ProviderResponse<K, R[K]> : never
  }[keyof R]
>

export type EndpointProvider<
  Q extends Query = Query,
  P extends Params = Params,
  Req = unknown,
  Res extends Responses = Responses,
> = {
  (request: Request<Q, P, Req>): Promise<ProviderResponses<Res>>
}

export type ProviderFunction<E extends Endpoint> =
  E extends Endpoint<infer Q, infer P, infer Req, infer Res> ? EndpointProvider<Q, P, Req, Res> : never

export type EndpointsProvider<T extends Endpoints> = {
  [K in keyof T]: ProviderFunction<T[K]>
}
