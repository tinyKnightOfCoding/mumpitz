import { Json } from './json'
import { isConstructor } from './constructor'
import { isDefined } from './defined'

export type ParserFunction<O> = (raw: Json | undefined) => O

export type ParserInterface<O> = {
  parse: ParserFunction<O>
}

export type ParseableType<O> = {
  new (value: never): O
  schema: ParserInterface<unknown>
}

export type Parser<O = unknown> = ParserFunction<O> | ParseableType<O> | ParserInterface<O>

export function parse<O>(parser: Parser<O>, raw: Json | undefined): O {
  if (isParseableType(parser)) {
    const parsed = parser.schema.parse(raw)
    return new parser(parsed as never)
  } else if (isParserInterface(parser)) {
    return parser.parse(raw)
  }
  return parser(raw)
}

function isParseableType<O>(parser: Parser<O>): parser is ParseableType<O> {
  return (
    isConstructor(parser) &&
    isDefined((parser as ParseableType<unknown>).schema) &&
    isParserInterface((parser as ParseableType<unknown>).schema)
  )
}

function isParserInterface<O>(parser: Parser<O>): parser is ParserInterface<O> {
  return (
    isDefined((parser as ParserInterface<unknown>).parse) &&
    typeof (parser as ParserInterface<unknown>).parse === 'function' &&
    (parser as ParserInterface<unknown>).parse.length >= 1
  )
}
