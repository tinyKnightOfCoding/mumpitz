import { Json, RawParams, RawQuery, RawRequest } from '@mumpitz/common'
import { Observable } from 'rxjs'
import { Endpoints, EndpointsProvider } from './provider'

export type ControllerBase<T extends Endpoints> = {
  readonly provider: EndpointsProvider<T>
}

export type RouteHandler = (
  rawPath: RawParams,
  rawBody: Json | undefined,
  rawQuery: RawQuery,
) => Promise<unknown> | Observable<unknown>

export function createRouteHandler<E extends Endpoints>(
  name: keyof E,
  endpoint: E[typeof name],
): ThisType<ControllerBase<E>> & RouteHandler {
  return function (this: ControllerBase<E>, params: RawParams, body: Json | undefined, query: RawQuery) {
    const rawRequest: RawRequest = { params, body, query }
    const request = endpoint.parse(rawRequest)
    return this.provider[name](request) // TODO error handling
  }
}
