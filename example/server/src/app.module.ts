import { Module } from '@nestjs/common'
import { TodoModule } from './todo'

@Module({
  imports: [TodoModule],
})
export class AppModule {}
