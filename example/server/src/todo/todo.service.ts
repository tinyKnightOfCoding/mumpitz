import { EndpointsProvider, ProviderResponse } from '@mumpitz/plugin-nestjs'
import { CreateTodoRequest, TodoDto, todoEndpoints, UpdateTodoRequest } from '@mumpitz/example-api'
import { Injectable } from '@nestjs/common'
import { EmptyObject, isDefined, Request } from '@mumpitz/common'
import { uuidv7 } from 'uuidv7'

@Injectable()
export class TodoService implements EndpointsProvider<typeof todoEndpoints> {
  private readonly todos = new Map<string, TodoDto>()
  async create(
    request: Request<EmptyObject, EmptyObject, CreateTodoRequest>,
  ): Promise<ProviderResponse<'created', TodoDto>> {
    const now = new Date()
    const todo = new TodoDto({
      ...request.body,
      id: uuidv7(),
      updatedAt: now,
      createdAt: now,
      isDone: false,
    })
    this.todos.set(todo.id, todo)
    return new ProviderResponse('created', todo)
  }

  async updateById(
    request: Request<EmptyObject, { id: string }, UpdateTodoRequest>,
  ): Promise<ProviderResponse<'ok', TodoDto> | ProviderResponse<'notFound', void>> {
    const todo = this.todos.get(request.params.id)
    if (!isDefined(todo)) return new ProviderResponse('notFound', undefined)
    const updatedTodo = todo.copy(request.body)
    this.todos.set(updatedTodo.id, updatedTodo)
    return new ProviderResponse('ok', updatedTodo)
  }

  async deleteById(request: Request<EmptyObject, { id: string }, void>): Promise<ProviderResponse<'noContent', void>> {
    this.todos.delete(request.params.id)
    return new ProviderResponse('noContent', undefined)
  }

  async getAll(): Promise<ProviderResponse<'ok', TodoDto[]>> {
    return new ProviderResponse('ok', [...this.todos.values()])
  }

  async getById(
    request: Request<EmptyObject, { id: string }, void>,
  ): Promise<ProviderResponse<'ok', TodoDto> | ProviderResponse<'notFound', void>> {
    const todo = this.todos.get(request.params.id)
    if (isDefined(todo)) return new ProviderResponse('ok', todo)
    throw new ProviderResponse('notFound', undefined)
  }
}
