import { Deserializer, JsonPrimitive, Serializable } from '../types'

export type RawQuery = Record<string, string | string[]>

export type Query = Record<string, JsonPrimitive | JsonPrimitive[]>

export type QueryDeserializer<O extends Query | Serializable<Query>> = Deserializer<O, RawQuery>
