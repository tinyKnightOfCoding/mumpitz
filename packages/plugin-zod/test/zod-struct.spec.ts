import { Json } from '@mumpitz/common'
import { ZodStruct } from '../src'
import { z } from 'zod'

class BookDto extends ZodStruct(
  z.object({
    id: z.string().toLowerCase(),
    title: z.string(),
    date: z.string().or(z.number()).pipe(z.coerce.date()),
  }),
) {
  static readonly deserialize = (raw: Json) => new BookDto(BookDto.shape.parse(raw))

  get computed() {
    return this.id.toUpperCase()
  }
}

describe('ZodStruct', () => {
  const book = BookDto.deserialize({
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
