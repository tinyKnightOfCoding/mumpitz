import { JsonPrimitive } from '../types'

export type RawQuery = Record<string, string | string[]>

export type Query = Record<string, JsonPrimitive | JsonPrimitive[]>
