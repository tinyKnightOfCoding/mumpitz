import { Observable, of } from 'rxjs'
import { Client, Endpoints } from '../src'
import { endpoint, Request } from '@mumpitz/common'
import { prop } from '@mumpitz/plugin-zod/dist/prop'
import { ZodStruct } from '@mumpitz/plugin-zod/dist/zod-struct'
import { z } from 'zod'
import { jest } from '@jest/globals'
import { HttpClient } from '@angular/common/http'

const noBody = () => {}

class BlogDto extends ZodStruct({
  id: z.string().optional(),
  title: z.string(),
  version: z.number(),
}) {}

const getBlogs = endpoint({
  method: 'get',
  path: '/blogs',
  responses: {
    ok: prop(BlogDto).array(),
  },
})
const getBlogById = endpoint({
  method: 'get',
  path: '/blogs/:id',
  params: z.object({ id: z.string() }),
  responses: {
    ok: BlogDto,
  },
})
const createBlog = endpoint({
  method: 'post',
  path: '/blogs',
  requestBody: BlogDto,
  responses: {
    created: noBody,
  },
})

class MockHttpClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request<T>(_method: string, _url: string, _options?: unknown): Observable<T> {
    return of({} as T)
  }
}

const blogEndpoints = { getBlogs, getBlogById, createBlog } satisfies Endpoints

class BlogClient extends Client(blogEndpoints) {}

describe('Client', () => {
  // Define your endpoints for testing
  let httpMock: HttpClient
  let client: BlogClient

  beforeEach(() => {
    httpMock = new MockHttpClient() as HttpClient
    client = new BlogClient(httpMock, '')
  })

  it('should have methods corresponding to endpoint names', () => {
    expect(typeof client.getBlogs).toBe('function')
    expect(typeof client.getBlogById).toBe('function')
    expect(typeof client.createBlog).toBe('function')
  })

  it('should call HttpClient request method with correct parameters', async () => {
    const spyHttpClientRequest = jest.spyOn(httpMock, 'request').mockReturnValue(of({}))

    client.getBlogs(new Request({}, {}, undefined))

    expect(spyHttpClientRequest).toHaveBeenCalledWith('get', '/blogs', expect.any(Object))
  })
})
