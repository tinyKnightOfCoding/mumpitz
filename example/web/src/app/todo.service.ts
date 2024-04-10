import { computed, inject, Injectable, signal } from '@angular/core'
import { TodoClient } from './todo.client'
import { CreateTodoRequest, TodoDto, UpdateTodoRequest } from '@mumpitz/example-api'
import { filter, map, tap } from 'rxjs'
import { UnknownResponse } from '@mumpitz/common'

@Injectable()
export class TodoService {
  readonly client = inject(TodoClient)

  private readonly todos = signal<Record<string, TodoDto>>({})
  readonly allTodos = computed(() => [...Object.values(this.todos())])

  constructor() {
    this.client
      .getAll({ query: {}, params: {}, body: undefined })
      .pipe(
        // implement error handling here
        tap(console.log),
        filter(response => !(response instanceof UnknownResponse)),
        map(response => response as TodoDto[]),
        tap(console.log),
      )
      .subscribe(initial => this.todos.set(this.toRecord(initial)))
  }

  create(request: CreateTodoRequest) {
    this.client
      .create({ params: {}, query: {}, body: request })
      .pipe(
        // implement error handling here
        filter(response => !(response instanceof UnknownResponse)),
        map(response => response as TodoDto),
      )
      .subscribe(todo => this.upsert(todo))
  }

  update(request: UpdateTodoRequest, id: string) {
    this.client
      .updateById({ params: { id }, query: {}, body: request })
      .pipe(
        // implement error handling here
        filter(response => !(response instanceof UnknownResponse)),
        map(response => response as TodoDto),
      )
      .subscribe(todo => this.upsert(todo))
  }

  delete(id: string) {
    this.client
      .deleteById({ params: { id }, query: {}, body: undefined })
      // implement error handling here
      .pipe(filter(response => !(response instanceof UnknownResponse)))
      .subscribe(() =>
        this.todos.update(todos => {
          const copy = { ...todos }
          delete copy[id]
          return copy
        }),
      )
  }

  private upsert(todo: TodoDto) {
    this.todos.update(todos => ({ ...todos, [todo.id]: todo }))
  }

  private toRecord(todos: TodoDto[]): Record<string, TodoDto> {
    return Object.fromEntries(todos.map(todo => [todo.id, todo]))
  }
}
