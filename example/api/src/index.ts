import { endpoint } from '@mumpitz/common'
import { ZodStruct } from '@mumpitz/plugin-zod'
import { z } from 'zod'

const dateProp = () => z.string().or(z.number()).pipe(z.coerce.date())

export class CreateTodoRequest extends ZodStruct({
  title: z.string(),
}) {}

export class TodoDto extends ZodStruct({
  id: z.string().uuid(),
  title: z.string(),
  isDone: z.boolean(),
  createdAt: dateProp(),
  updatedAt: dateProp(),
}) {}

const createTodo = endpoint({
  method: 'POST',
  path: '/todos',
  requestBody: CreateTodoRequest,
  responseStatus: 'created',
  responseBody: TodoDto,
})

export const todoEndpoints = {
  createTodo,
}
