import { expectType, TypeEqual } from 'ts-expect'
import { CreateTodoRequest, TodoDto, todoEndpoints } from '../src'
import { EmptyObject, Endpoint } from '@mumpitz/common'

describe('API', () => {
  it('should infer class types', () => {
    expectType<
      TypeEqual<(typeof todoEndpoints)['createTodo'], Endpoint<EmptyObject, EmptyObject, CreateTodoRequest, TodoDto>>
    >(true)
  })
})
