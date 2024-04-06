import { DynamicController, Endpoints, EndpointsProvider, ProviderFunction } from '../src'
import { Controller, Injectable, RequestMethod } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { endpoint, Request } from '@mumpitz/common'
import { z } from 'zod'
import { prop, ZodStruct } from '@mumpitz/plugin-zod/src'
import { jest } from '@jest/globals'

class BlogDto extends ZodStruct({
  id: z.string().optional(),
  title: z.string(),
  version: z.number(),
}) {}

const getBlogs = endpoint({ method: 'get', path: '/blogs', responseBody: prop(BlogDto).array() })
const getBlogById = endpoint({
  method: 'get',
  path: '/blogs/:id',
  params: z.object({ id: z.string() }),
  responseBody: BlogDto,
})
const createBlog = endpoint({
  method: 'post',
  path: '/blogs',
  requestBody: BlogDto,
  responseStatus: 'created',
})

const blogEndpoints = { getBlogs, getBlogById, createBlog } satisfies Endpoints

type BlogEndpoints = typeof blogEndpoints

@Injectable()
class NoopBlogProvider implements EndpointsProvider<BlogEndpoints> {
  getBlogById(): Promise<BlogDto> {
    return Promise.resolve(
      new BlogDto({
        id: 'SomeId',
        title: 'The title',
        version: 5,
      }),
    )
  }

  getBlogs(): Promise<BlogDto[]> {
    return Promise.resolve([])
  }

  createBlog(): Promise<void> {
    return Promise.resolve()
  }
}

@Controller()
class BlogController extends DynamicController(blogEndpoints, NoopBlogProvider) {}

describe('DynamicController', () => {
  it('should have name', () => {
    expect(BlogController.name).toEqual('BlogController')
  })

  it('should have metadata keys', () => {
    expect(Reflect.getMetadataKeys(BlogController.prototype.constructor, 'getBlogs')).toEqual([ROUTE_ARGS_METADATA])
    expect(BlogController.prototype.getBlogs).toBeDefined()
    expect(Reflect.getMetadataKeys(BlogController.prototype.getBlogs)).toEqual([
      HTTP_CODE_METADATA,
      PATH_METADATA,
      METHOD_METADATA,
    ])
  })

  it('getBlogById', () => {
    expect(Reflect.getMetadata(PATH_METADATA, BlogController.prototype.getBlogById)).toEqual('/blogs/:id')
    expect(Reflect.getMetadata(METHOD_METADATA, BlogController.prototype.getBlogById)).toEqual(RequestMethod.GET)
  })

  it('getBlogs', () => {
    expect(Reflect.getMetadata(PATH_METADATA, BlogController.prototype.getBlogs)).toEqual('/blogs')
    expect(Reflect.getMetadata(METHOD_METADATA, BlogController.prototype.getBlogs)).toEqual(RequestMethod.GET)
  })

  describe('nestjs', () => {
    const blogProvider: EndpointsProvider<BlogEndpoints> = {
      getBlogs: jest.fn<ProviderFunction<typeof getBlogs>>(),
      getBlogById: jest.fn<ProviderFunction<typeof getBlogById>>(),
      createBlog: jest.fn<ProviderFunction<typeof createBlog>>(),
    }
    let app: NestFastifyApplication

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [BlogController],
        providers: [NoopBlogProvider],
      })
        .overrideProvider(NoopBlogProvider)
        .useValue(blogProvider)
        .compile()
      app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
      await app.init()
      await app.getHttpAdapter().getInstance().ready()
    })

    it('getBlogs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blogs',
      })
      expect(response.statusCode).toEqual(200)
      expect(blogProvider.getBlogs).toHaveBeenCalled()
    })

    it('getBlogById', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/blogs/123',
      })
      expect(response.statusCode).toEqual(200)
      expect(blogProvider.getBlogById).toHaveBeenCalledWith({
        params: { id: '123' },
        body: undefined,
        query: {},
      })
    })

    it('createBlog', async () => {
      const blog = new BlogDto({
        id: 'Some Id',
        version: 3,
        title: 'The Title',
      })
      const response = await app.inject({
        method: 'POST',
        url: '/blogs',
        body: blog,
      })
      expect(response.statusCode).toEqual(201)
      expect(blogProvider.createBlog).toHaveBeenCalledWith(new Request({}, {}, blog))
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    afterAll(async () => {
      await app.close()
    })
  })
})
