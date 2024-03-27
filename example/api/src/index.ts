import { ZodStruct, ZodValue } from '@mumpitz/plugin-zod'
import { z } from 'zod'
import { uuidv7 } from 'uuidv7'

export class TodoId extends ZodValue(z.string().uuid()) {
  static random() {
    return new TodoId(uuidv7())
  }
}

export class TodoDto extends ZodStruct({
  id: TodoId.prop().default(() => uuidv7()),
}) {}
