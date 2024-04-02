import { Body, Delete, Get, HttpCode, Param, Patch, Post, Put, Query as QueryDecorator } from '@nestjs/common'
import { Endpoint, httpStatusCodes, Params, Query } from '@mumpitz/common'

export function annotateRouteHandler(target: object, key: string, descriptor: PropertyDescriptor, endpoint: Endpoint) {
  HttpCode(httpStatusCodes[endpoint.responseStatus])(target, key, descriptor)
  httpMethod(endpoint)(target, key, descriptor)
  Param()(target, key, 0)
  Body()(target, key, 1)
  QueryDecorator()(target, key, 2)
}

function httpMethod(endpoint: Endpoint<Query, Params, unknown, unknown>): MethodDecorator {
  switch (endpoint.method) {
    case 'get':
      return Get(endpoint.path)
    case 'post':
      return Post(endpoint.path)
    case 'patch':
      return Patch(endpoint.path)
    case 'put':
      return Put(endpoint.path)
    case 'delete':
      return Delete(endpoint.path)
  }
}
