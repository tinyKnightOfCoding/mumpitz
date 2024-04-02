import { ZodStruct } from '../src'
import { z } from 'zod'
import { parse } from '@mumpitz/common'

class BookDto extends ZodStruct({
  id: z.string().toLowerCase(),
  title: z.string(),
  date: z.string().or(z.number()).pipe(z.coerce.date()),
}) {}

describe('ZodStruct', () => {
  const book = parse(BookDto, {
    id: 'Hello',
    title: 'Blubb',
    date: '2024-01-01',
  })

  it('should deserialize', () => {
    expect(book.id).toEqual('hello')
    expect(book.title).toEqual('Blubb')
    expect(book.date).toEqual(new Date('2024-01-01'))
  })

  it('should serialize', () => {
    expect(JSON.parse(JSON.stringify(book))).toEqual({
      id: 'hello',
      title: 'Blubb',
      date: '2024-01-01T00:00:00.000Z',
    })
  })
})
