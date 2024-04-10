import { endpoint } from '@mumpitz/common'
import { prop, ZodStruct } from '@mumpitz/plugin-zod'
import { z } from 'zod'

const dateProp = () => z.string().or(z.number()).pipe(z.coerce.date())

const noBody = () => {}

export class CreateTodoRequest extends ZodStruct({
  title: z.string(),
}) {}

export class UpdateTodoRequest extends ZodStruct({
  title: z.string(),
  isDone: z.boolean(),
}) {}

export class TodoDto extends ZodStruct({
  id: z.string().uuid(),
  title: z.string(),
  isDone: z.boolean(),
  createdAt: dateProp(),
  updatedAt: dateProp(),
}) {}

const create = endpoint({
  method: 'post',
  path: '/todos',
  requestBody: CreateTodoRequest,
  responses: {
    created: TodoDto,
  },
})

const deleteById = endpoint({
  method: 'delete',
  path: '/todos/:id',
  params: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    noContent: noBody,
  },
})

const updateById = endpoint({
  method: 'put',
  path: '/todos/:id',
  params: z.object({
    id: z.string().uuid(),
  }),
  requestBody: UpdateTodoRequest,
  responses: {
    ok: TodoDto,
    notFound: noBody,
  },
})

const getAll = endpoint({
  method: 'get',
  path: '/todos',
  query: z.object({
    isDone: z.boolean().optional(),
  }),
  responses: {
    ok: prop(TodoDto).array(),
  },
})

const getById = endpoint({
  method: 'get',
  path: '/todos/:id',
  params: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    ok: TodoDto,
    notFound: noBody,
  },
})

export const todoEndpoints = {
  create,
  deleteById,
  updateById,
  getAll,
  getById,
} as const
