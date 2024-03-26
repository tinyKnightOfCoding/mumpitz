import { Query, RawQuery } from './query'
import { Params, RawParams } from './params'
import { Json } from '../types'

export type RawRequest = {
  query: RawQuery
  params: RawParams
  body: Json
}

export class Request<Q extends Query, P extends Params, R> {
  constructor(
    readonly query: Q,
    readonly params: P,
    readonly body: R,
  ) {}
}
