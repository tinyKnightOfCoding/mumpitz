import { Controller, Get, Param, Query } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('/hello/:id/*')
  hello(@Param() param: unknown, @Query() query: unknown) {
    return { param, query }
  }
}
