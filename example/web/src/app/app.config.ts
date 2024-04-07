import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'
import { TodoService } from './todo.service'
import { TodoClient } from './todo.client'
import { provideHttpClient } from '@angular/common/http'

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), TodoService, TodoClient, provideHttpClient()],
}
