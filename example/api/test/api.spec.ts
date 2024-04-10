import { expectType, TypeEqual } from 'ts-expect'
import { CreateTodoRequest, TodoDto, todoEndpoints } from '../src'
import { EmptyObject, Endpoint } from '@mumpitz/common'

describe('API', () => {
  it('should infer class types', () => {
    type CreateTodoEndpoint = (typeof todoEndpoints)['create']
    expectType<
      TypeEqual<CreateTodoEndpoint, Endpoint<EmptyObject, EmptyObject, CreateTodoRequest, { created: TodoDto }>>
    >(true)
  })
})
