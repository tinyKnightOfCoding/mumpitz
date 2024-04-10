import { HttpStatus, HttpStatusCode, httpStatusForCode, isDefined, Json, parse, Parser } from '../types'

export type ResponseParser = { [key in HttpStatus]?: Parser }

export type Parsed<P extends Parser> = P extends Parser<infer O> ? O : never

export type InferResponse<R extends ResponseParser> = {
  [K in keyof R]: R[K] extends Parser ? Parsed<R[K]> : never
}[keyof R]

export class UnknownResponse {
  constructor(
    readonly httpStatus: HttpStatus,
    readonly body: Json | undefined,
  ) {}
}

export function parseResponse<R extends ResponseParser>(
  parsers: R,
  httpStatusCode: HttpStatusCode,
  body: Json | undefined,
): InferResponse<R> | UnknownResponse {
  const httpStatus = httpStatusForCode(httpStatusCode)
  try {
    const parser = parsers[httpStatus]
    if (isDefined(parser)) {
      return parse(parser, body) as InferResponse<R>
    }
  } catch (error) {
    // nothing to do, just return UnknownResponse
  }
  return new UnknownResponse(httpStatus, body)
}
