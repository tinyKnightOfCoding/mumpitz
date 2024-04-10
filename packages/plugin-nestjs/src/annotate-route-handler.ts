import { Body, Delete, Get, Param, Patch, Post, Put, Query as QueryDecorator, Res } from '@nestjs/common'
import { Endpoint } from '@mumpitz/common'

export function annotateRouteHandler(target: object, key: string, descriptor: PropertyDescriptor, endpoint: Endpoint) {
  httpMethod(endpoint)(target, key, descriptor)
  Param()(target, key, 0)
  Body()(target, key, 1)
  QueryDecorator()(target, key, 2)
  Res()(target, key, 3)
}

function httpMethod(endpoint: Endpoint): MethodDecorator {
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
