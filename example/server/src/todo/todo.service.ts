import { EndpointsProvider } from '@mumpitz/plugin-nestjs'
import { CreateTodoRequest, TodoDto, todoEndpoints, UpdateTodoRequest } from '@mumpitz/example-api'
import { Injectable, NotFoundException } from '@nestjs/common'
import { EmptyObject, isDefined, Request } from '@mumpitz/common'
import { uuidv7 } from 'uuidv7'

@Injectable()
export class TodoService implements EndpointsProvider<typeof todoEndpoints> {
  private readonly todos = new Map<string, TodoDto>()
  async create(request: Request<EmptyObject, EmptyObject, CreateTodoRequest>): Promise<TodoDto> {
    const now = new Date()
    const todo = new TodoDto({
      ...request.body,
      id: uuidv7(),
      updatedAt: now,
      createdAt: now,
      isDone: false,
    })
    this.todos.set(todo.id, todo)
    return todo
  }

  async updateById(request: Request<EmptyObject, { id: string }, UpdateTodoRequest>): Promise<TodoDto> {
    const todo = this.todos.get(request.params.id)
    if (!isDefined(todo)) throw new NotFoundException()
    const updatedTodo = todo.copy(request.body)
    this.todos.set(updatedTodo.id, updatedTodo)
    return updatedTodo
  }

  async deleteById(request: Request<EmptyObject, { id: string }, void>): Promise<void> {
    this.todos.delete(request.params.id)
  }

  async getAll(): Promise<TodoDto[]> {
    return [...this.todos.values()]
  }

  async getById(request: Request<EmptyObject, { id: string }, void>): Promise<TodoDto> {
    const todo = this.todos.get(request.params.id)
    if (isDefined(todo)) return todo
    throw new NotFoundException()
  }
}
