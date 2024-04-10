import { HttpStatus, HttpStatusCode, httpStatusForCode, isDefined, Json, parse, Parser } from '../types'

export type Responses = { [K in HttpStatus]?: unknown }

export type ResponseParser<R extends Responses = Responses> = { [K in keyof R]?: Parser<R[K]> }

export class UnknownResponse {
  constructor(
    readonly httpStatus: HttpStatus,
    readonly body: Json | undefined,
  ) {}
}

export function parseResponse<R extends Responses>(
  parsers: ResponseParser<R>,
  httpStatusCode: HttpStatusCode,
  body: Json | undefined,
): R[keyof R] | UnknownResponse {
  const httpStatus = httpStatusForCode(httpStatusCode)
  try {
    const parser = parsers[httpStatus]
    if (isDefined(parser)) {
      return parse(parser, body)
    }
  } catch (error) {
    // nothing to do, just return UnknownResponse
  }
  return new UnknownResponse(httpStatus, body)
}
