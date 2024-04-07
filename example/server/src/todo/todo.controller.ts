import { DynamicController } from '@mumpitz/plugin-nestjs'
import { todoEndpoints } from '@mumpitz/example-api'
import { TodoService } from './todo.service'
import { Controller } from '@nestjs/common'

@Controller()
export class TodoController extends DynamicController(todoEndpoints, TodoService) {}
