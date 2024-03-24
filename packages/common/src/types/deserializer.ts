import { Json } from './json'
import { isConstructor } from './constructor'

export type Deserializer<O = unknown, I extends Json = Json> =
  | DeserializerFunction<O, I>
  | DeserializerConstructor<O, I>

export type DeserializerFunction<O = unknown, I extends Json = Json> = (raw: I) => O

export type DeserializerConstructor<O = unknown, I extends Json = Json> = new (raw: I) => O

export function deserialize<O = unknown, I extends Json = Json>(deserializer: Deserializer<O, I>, payload: I): O {
  if (isDeserializerConstructor(deserializer)) return new deserializer(payload)
  return deserializer(payload)
}

function isDeserializerConstructor<O = unknown, I extends Json = Json>(
  subject: Deserializer<O, I>,
): subject is DeserializerConstructor<O, I> {
  return isConstructor(subject)
}
