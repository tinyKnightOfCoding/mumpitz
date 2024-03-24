import { Json } from './json'
import { isConstructor } from './constructor'
import { isDefined } from './defined'

export type Deserializer<O = unknown, I extends Json = Json> =
  | DeserializerObject<O, I>
  | DeserializerFunction<O, I>
  | DeserializerConstructor<O, I>

export type DeserializerObject<O = unknown, I extends Json = Json> = {
  deserialize(raw: I): O
}

export type DeserializerFunction<O = unknown, I extends Json = Json> = (raw: I) => O

export type DeserializerConstructor<O = unknown, I extends Json = Json> = new (raw: I) => O

export function deserialize<O = unknown, I extends Json = Json>(deserializer: Deserializer<O, I>, raw: I): O {
  if (isDeserializerObject(deserializer)) return deserializer.deserialize(raw)
  if (isDeserializerConstructor(deserializer)) return new deserializer(raw)
  return deserializer(raw)
}

function isDeserializerConstructor<O = unknown, I extends Json = Json>(
  subject: Deserializer<O, I>,
): subject is DeserializerConstructor<O, I> {
  return isConstructor(subject)
}

function isDeserializerObject<O = unknown, I extends Json = Json>(
  subject: Deserializer<O, I>,
): subject is DeserializerObject<O, I> {
  return (
    isDefined(subject) &&
    typeof (subject as DeserializerObject).deserialize === 'function' &&
    (subject as DeserializerObject).deserialize.length === 1
  )
}
