import { Json } from './json'
import { isConstructor } from './constructor'
import { isDefined } from './defined'

export type ParserFunction<O> = (raw: Json) => O

export type ParserInterface<O> = {
  parse: ParserFunction<O>
}

export type ParseableType<O, T> = {
  new (value: O): T
  parse: ParserFunction<O>
}

export type Parser<O> = ParserFunction<O> | ParserInterface<O> | ParseableType<unknown, O>

export function parse<O>(parser: Parser<O>, raw: Json): O {
  if (isParseableType(parser)) {
    const parsed = parser.parse(raw)
    return new parser(parsed)
  } else if (isParserInterface(parser)) {
    return parser.parse(raw)
  }
  return parser(raw)
}

function isParseableType<O>(parser: Parser<O>): parser is ParseableType<unknown, O> {
  return isConstructor(parser) && isParserInterface(parser)
}

function isParserInterface<O>(parser: Parser<O>): parser is ParserInterface<O> {
  return (
    isDefined((parser as ParserInterface<unknown>).parse) &&
    typeof (parser as ParserInterface<unknown>).parse === 'function' &&
    (parser as ParserInterface<unknown>).parse.length === 1
  )
}
