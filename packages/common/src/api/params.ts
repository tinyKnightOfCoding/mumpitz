import { Deserializer, JsonPrimitive, Serializable } from '../types'

export type RawParams = Record<string, string>

export type Params = Record<string, JsonPrimitive>

export type ParamsDeserializer<O extends Params | Serializable<Params>> = Deserializer<O, RawParams>
