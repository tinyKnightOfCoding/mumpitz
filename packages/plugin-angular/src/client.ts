import { HttpClient, HttpResponse } from '@angular/common/http'
import { map, Observable } from 'rxjs'
import { EndpointClient, Endpoints, EndpointsClient } from './endpoints'
import {
  Endpoint,
  isHttpStatusCode,
  Json,
  JsonPrimitive,
  Params,
  Query,
  Request,
  Responses,
  UnknownResponse,
} from '@mumpitz/common'

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

function createEndpointFunction<
  Q extends Query = Query,
  P extends Params = Params,
  Req = unknown,
  Res extends Responses = Responses,
>(endpoint: Endpoint<Q, P, Req, Res>): EndpointClient<Q, P, Req, Res> & ThisType<ClientThis> {
  return function handle(this: ClientThis, request: Request<Q, P, Req>): Observable<Res[keyof Res] | UnknownResponse> {
    return this.http
      .request<Json | undefined>(endpoint.method, toPath(endpoint.path, this.baseUrl, request.params), {
        responseType: 'json',
        observe: 'response',
        body: request.body,
        params: request.query,
      })
      .pipe(map(response => parseResponse(endpoint, response)))
  }
}

function parseResponse<Res extends Responses>(
  endpoint: Endpoint<Query, Params, unknown, Res>,
  httpResponse: HttpResponse<Json | undefined>,
): Res[keyof Res] | UnknownResponse {
  const httpStatus = httpResponse.status
  if (isHttpStatusCode(httpStatus)) {
    return endpoint.parseResponse(httpStatus, httpResponse.body)
  }
  throw new Error(`Invalid HTTP status code: ${httpStatus}`)
}

function toPath<P extends Params>(path: string, baseUrl: string, params: P): string {
  const replacedPath = Object.entries(params).reduce(replaceParam, path)
  return `${baseUrl}/${replacedPath}`.replaceAll(/\/+/g, '/')
}

function replaceParam(path: string, [paramName, paramValue]: [string, JsonPrimitive]): string {
  return path.replaceAll(`:${paramName}`, `${paramValue}`)
}
