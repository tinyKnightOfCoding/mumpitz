import { Controller, Inject, Type } from '@nestjs/common'
import { annotateRouteHandler } from './annotate-route-handler'
import { ControllerBase, createRouteHandler, RouteHandler } from './create-route-handler'
import { Endpoints, EndpointsProvider } from './provider'

type RouteHandlers<E extends Endpoints> = {
  [K in keyof E]: RouteHandler
}

export function DynamicController<E extends Endpoints>(
  endpoints: E,
  providerType: Type<EndpointsProvider<E>>,
): Type<ControllerBase<E> & RouteHandlers<E>> {
  @Controller()
  class _Controller implements ControllerBase<E> {
    constructor(@Inject(providerType) readonly provider: EndpointsProvider<E>) {}
  }
  Object.entries(endpoints).forEach(([key, endpoint]) => {
    const descriptor: PropertyDescriptor = { value: createRouteHandler(key, endpoint) }
    Object.defineProperty(_Controller.prototype, key, descriptor)
    annotateRouteHandler(_Controller.prototype, key, descriptor, endpoint)
  })
  return _Controller as Type<ControllerBase<E> & RouteHandlers<E>>
}
