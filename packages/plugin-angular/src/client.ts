import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { EndpointClient, Endpoints, EndpointsClient } from './endpoints'
import { Endpoint, JsonPrimitive, Params, Query, Request } from '@mumpitz/common'

type ClientThis = {
  readonly http: HttpClient
  readonly baseUrl: string
}

export type ClientConstructor<E extends Endpoints> = {
  new (http: HttpClient, baseUrl?: string): EndpointsClient<E>
}

export function Client<E extends Endpoints>(endpoints: E): ClientConstructor<E> {
  class _Client implements ClientThis {
    constructor(
      readonly http: HttpClient,
      readonly baseUrl: string = '',
    ) {
      Object.defineProperties<ClientThis>(
        this,
        Object.fromEntries(
          Object.entries(endpoints).map(([functionName, endpoint]) => [
            functionName,
            { value: createEndpointFunction(endpoint) },
          ]),
        ),
      )
    }
  }
  return _Client as ClientConstructor<E>
}

function createEndpointFunction<Q extends Query = Query, P extends Params = Params, Req = unknown, Res = unknown>(
  endpoint: Endpoint<Q, P, Req, Res>,
): EndpointClient<Q, P, Req, Res> & ThisType<ClientThis> {
  function handle(this: ClientThis, request: Request<Q, P, Req>): Observable<Res> {
    return this.http.request<Res>(endpoint.method, toPath(endpoint.path, this.baseUrl, request.params), {
      responseType: 'json',
      observe: 'body',
      body: request.body,
    })
  }
  return handle
}

function toPath<P extends Params>(path: string, baseUrl: string, params: P): string {
  const replacedPath = Object.entries(params).reduce(replaceParam, path)
  return `${baseUrl}/${replacedPath}`
}

function replaceParam(path: string, [paramName, paramValue]: [string, JsonPrimitive]): string {
  return path.replaceAll(`:${paramName}`, `${paramValue}`)
}
