export type Json = JsonArray | JsonObject | JsonPrimitive | null

export type JsonObject = { [key: string]: Json }

export type JsonArray = Json[]

export type JsonPrimitive = string | number | boolean
