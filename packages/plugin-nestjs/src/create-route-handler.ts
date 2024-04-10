import { isDefined, Json, RawParams, RawQuery, RawRequest } from '@mumpitz/common'
import { Endpoints, EndpointsProvider } from './provider'
import { FastifyReply } from 'fastify'
import { Response } from 'express'
import { InternalServerErrorException } from '@nestjs/common'

export type ControllerBase<T extends Endpoints> = {
  readonly provider: EndpointsProvider<T>
}

export type RouteHandler = (
  rawPath: RawParams,
  rawBody: Json | undefined,
  rawQuery: RawQuery,
  res: FastifyReply | Response,
) => Promise<void>

export function createRouteHandler<E extends Endpoints>(
  name: keyof E,
  endpoint: E[typeof name],
): ThisType<ControllerBase<E>> & RouteHandler {
  return async function (
    this: ControllerBase<E>,
    params: RawParams,
    body: Json | undefined,
    query: RawQuery,
    response: FastifyReply | Response,
  ) {
    const rawRequest: RawRequest = { params, body, query }
    const request = endpoint.parseRequest(rawRequest)
    const providerResponse = await this.provider[name](request)
    if (!isDefined(providerResponse)) throw new InternalServerErrorException('could not find response')
    response.status(providerResponse.statusCode).send(providerResponse.body)
  }
}
