import { Endpoint, Params, Query, Request, Responses, UnknownResponse } from '@mumpitz/common'
import { Observable } from 'rxjs'

export type Endpoints = Record<string, Endpoint>

export type EndpointClient<
  Q extends Query = Query,
  P extends Params = Params,
  Req = unknown,
  Res extends Responses = Responses,
> = {
  (request: Request<Q, P, Req>): Observable<Res[keyof Res] | UnknownResponse>
}

export type ClientFunction<E extends Endpoint> =
  E extends Endpoint<infer Q, infer P, infer Req, infer Res> ? EndpointClient<Q, P, Req, Res> : never

export type EndpointsClient<E extends Endpoints> = {
  [K in keyof E]: ClientFunction<E[K]>
}
