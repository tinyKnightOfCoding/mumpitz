import { ZodValue } from '../src'
import { z } from 'zod'
import { expectType, TypeEqual } from 'ts-expect'

class BookId extends ZodValue(z.string()) {}

const dateShape = z.string().or(z.number()).pipe(z.coerce.date())

class DateValue extends ZodValue(dateShape) {}

describe('ZodValue', () => {
  const bookId = BookId.deserialize('Hello, World!')
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
