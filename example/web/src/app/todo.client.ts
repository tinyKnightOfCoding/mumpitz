import { Injectable } from '@angular/core'
import { todoEndpoints } from '@mumpitz/example-api'
import { Client } from '@mumpitz/plugin-angular'
import { HttpClient } from '@angular/common/http'

@Injectable()
export class TodoClient extends Client(todoEndpoints) {
  constructor(http: HttpClient) {
    super(http, '/api')
  }
}
