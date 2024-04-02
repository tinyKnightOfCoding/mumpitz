export const httpMethods = ['get', 'post', 'put', 'patch', 'delete'] as const

export type HttpMethod = (typeof httpMethods)[number]
