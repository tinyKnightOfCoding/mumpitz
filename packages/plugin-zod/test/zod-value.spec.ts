import { ZodValue } from '../src/zod-value'
import { z } from 'zod'
import { JsonPrimitive } from '@mumpitz/common'
import { expectType, TypeEqual } from 'ts-expect'

class BookId extends ZodValue(z.string().default('Hello, World!')) {
  static readonly deserialize = (raw: JsonPrimitive | undefined) => new BookId(BookId.shape.parse(raw))
}

class DateValue extends ZodValue<Date>(z.string().or(z.number()).pipe(z.coerce.date())) {
  static readonly deserialize = (raw: JsonPrimitive | undefined) => new DateValue(DateValue.shape.parse(raw))
}

describe('ZodValue', () => {
  const bookId = BookId.deserialize(undefined)
  const date = DateValue.deserialize('2024-01-01')

  it('should have value property', () => {
    expect(bookId.value).toEqual('Hello, World!')
    expect(date.value).toEqual(new Date('2024-01-01'))
  })

  it('should serialize', () => {
    expect(JSON.stringify(bookId)).toEqual('"Hello, World!"')
    expect(JSON.stringify(date)).toEqual('"2024-01-01T00:00:00.000Z"')
  })

  it('should infer output', () => {
    expectType<TypeEqual<DateValue['value'], Date>>(true)
  })
})
