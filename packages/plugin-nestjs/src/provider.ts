import { Endpoint, Params, Query, Request } from '@mumpitz/common'
import { Observable } from 'rxjs'

export type Endpoints = Record<string, Endpoint>

export type EndpointProvider<Q extends Query = Query, P extends Params = Params, Req = unknown, Res = unknown> = {
  (request: Request<Q, P, Req>): Promise<Res> | Observable<Res>
}

export type ProviderFunction<E extends Endpoint> =
  E extends Endpoint<infer Q, infer P, infer Req, infer Res> ? EndpointProvider<Q, P, Req, Res> : never

export type EndpointsProvider<T extends Endpoints> = {
  [K in keyof T]: ProviderFunction<T[K]>
}
